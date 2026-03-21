"""Unit tests for the User Profile Tool."""

import pytest
from pydantic import ValidationError
from models.user import UserProfile
from models.enums import JobStability, RiskTolerance
from tools.user_profile.service import save_profile, get_profile, validate_and_enrich


class TestSaveAndRetrieveProfile:
    """Test save + get round-trip with isolated temp DB."""

    def test_save_and_get_round_trip(self, high_income_profile, tmp_db_path):
        save_profile(high_income_profile, db_path=tmp_db_path)
        retrieved = get_profile(high_income_profile.user_id, db_path=tmp_db_path)
        assert retrieved is not None
        assert retrieved.user_id == high_income_profile.user_id
        assert retrieved.age == high_income_profile.age
        assert retrieved.income == high_income_profile.income
        assert retrieved.credit_score == high_income_profile.credit_score
        assert retrieved.goals == high_income_profile.goals

    def test_upsert_overwrites(self, high_income_profile, tmp_db_path):
        save_profile(high_income_profile, db_path=tmp_db_path)
        # Create updated profile with same user_id but different income
        updated = UserProfile(
            user_id=high_income_profile.user_id,
            age=high_income_profile.age,
            income=150_000,
            credit_score=high_income_profile.credit_score,
            job_stability=high_income_profile.job_stability,
            risk_tolerance=high_income_profile.risk_tolerance,
            goals=high_income_profile.goals,
        )
        save_profile(updated, db_path=tmp_db_path)
        retrieved = get_profile(high_income_profile.user_id, db_path=tmp_db_path)
        assert retrieved is not None
        assert retrieved.income == 150_000

    def test_get_nonexistent_returns_none(self, tmp_db_path):
        result = get_profile("nonexistent-id", db_path=tmp_db_path)
        assert result is None


class TestValidateAndEnrich:
    """Test default-filling and validation."""

    def test_fills_defaults(self):
        profile = validate_and_enrich({
            "user_id": "enrich-test",
            "age": 30,
            "income": 50_000,
            "credit_score": 700,
        })
        assert profile.risk_tolerance == RiskTolerance.MEDIUM
        assert profile.job_stability == JobStability.STABLE
        assert profile.financial_holdings == {}
        assert profile.goals == []

    def test_preserves_explicit_values(self):
        profile = validate_and_enrich({
            "user_id": "explicit-test",
            "age": 40,
            "income": 80_000,
            "credit_score": 750,
            "risk_tolerance": "high",
            "job_stability": "contract",
            "goals": ["retirement"],
        })
        assert profile.risk_tolerance == RiskTolerance.HIGH
        assert profile.job_stability == JobStability.CONTRACT
        assert profile.goals == ["retirement"]

    def test_invalid_credit_score_raises(self):
        with pytest.raises(ValidationError):
            validate_and_enrich({
                "user_id": "bad-credit",
                "age": 30,
                "income": 50_000,
                "credit_score": 200,  # below 300 minimum
            })

    def test_negative_income_raises(self):
        with pytest.raises(ValidationError):
            validate_and_enrich({
                "user_id": "neg-income",
                "age": 30,
                "income": -1000,
                "credit_score": 700,
            })
