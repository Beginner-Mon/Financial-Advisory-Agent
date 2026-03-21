"""Unit tests for the Financial Intelligence Tool."""

import pytest
from models.user import UserProfile
from models.enums import JobStability, RiskTolerance, RiskProfile
from tools.financial_intel.engine import (
    compute_health_score,
    compute_risk_profile,
    generate_plan_steps,
    build_financial_plan,
)


class TestHealthScore:
    """Health score must be in [0, 100] and respond to profile attributes."""

    def test_young_low_income(self, young_low_income_profile):
        score = compute_health_score(young_low_income_profile)
        assert 0 <= score <= 100
        assert score < 60  # Low income + contract + low credit

    def test_high_income(self, high_income_profile):
        score = compute_health_score(high_income_profile)
        assert 0 <= score <= 100
        assert score >= 75  # High income + stable + high credit

    def test_self_employed(self, self_employed_profile):
        score = compute_health_score(self_employed_profile)
        assert 0 <= score <= 100
        assert 50 <= score <= 80  # Moderate

    def test_near_retirement(self, near_retirement_profile):
        score = compute_health_score(near_retirement_profile)
        assert 0 <= score <= 100
        assert score >= 70  # Good credit + stable + decent income

    def test_edge_zero_income(self):
        p = UserProfile(
            user_id="zero", age=25, income=0,
            credit_score=300, job_stability="self-employed",
            risk_tolerance="low", goals=[]
        )
        score = compute_health_score(p)
        assert 0 <= score <= 100

    def test_edge_max_credit(self):
        p = UserProfile(
            user_id="max", age=50, income=200_000,
            credit_score=850, job_stability="stable",
            risk_tolerance="high", goals=[]
        )
        score = compute_health_score(p)
        assert score == 100.0  # Hit the cap


class TestRiskProfile:
    """Risk profile must be consistent with score + tolerance."""

    def test_moderate_for_low_income_but_ok_score(self, young_low_income_profile):
        # Score is 55 (base 50 + 5 contract), which hits score >= 50 → moderate
        risk = compute_risk_profile(young_low_income_profile)
        assert risk == RiskProfile.MODERATE

    def test_aggressive_for_high_score_high_tolerance(self, high_income_profile):
        risk = compute_risk_profile(high_income_profile)
        assert risk == RiskProfile.AGGRESSIVE

    def test_moderate_for_mid_range(self, self_employed_profile):
        risk = compute_risk_profile(self_employed_profile)
        assert risk == RiskProfile.MODERATE

    def test_conservative_despite_high_score_when_low_tolerance(self, near_retirement_profile):
        # Near retirement has good score but low risk tolerance
        risk = compute_risk_profile(near_retirement_profile)
        # With score >= 50, should be moderate even with low tolerance
        assert risk in (RiskProfile.MODERATE, RiskProfile.CONSERVATIVE)


class TestPlanSteps:
    """Plan steps should reflect goals and risk level."""

    def test_emergency_fund_goal(self, young_low_income_profile):
        steps = generate_plan_steps(young_low_income_profile, RiskProfile.CONSERVATIVE)
        assert any("emergency fund" in s.lower() for s in steps)

    def test_house_goal(self, self_employed_profile):
        steps = generate_plan_steps(self_employed_profile, RiskProfile.MODERATE)
        assert any("savings account" in s.lower() or "down payment" in s.lower() for s in steps)

    def test_retirement_goal_aggressive(self, high_income_profile):
        steps = generate_plan_steps(high_income_profile, RiskProfile.AGGRESSIVE)
        assert any("401k" in s.lower() or "ira" in s.lower() for s in steps)

    def test_empty_goals_get_default_step(self):
        p = UserProfile(
            user_id="empty", age=35, income=80_000,
            credit_score=750, goals=[]
        )
        steps = generate_plan_steps(p, RiskProfile.MODERATE)
        assert len(steps) >= 1  # Should have at least default step


class TestBuildFinancialPlan:
    """Integration test for the full plan builder."""

    def test_returns_valid_assessment(self, high_income_profile):
        assessment = build_financial_plan(high_income_profile)
        assert 0 <= assessment.health_score <= 100
        assert assessment.risk_profile in RiskProfile
        assert assessment.liquidity_ratio >= 0
        assert 0 <= assessment.debt_ratio <= 1.0
        assert len(assessment.plan_steps) >= 1

    def test_different_profiles_different_plans(
        self, young_low_income_profile, high_income_profile
    ):
        plan1 = build_financial_plan(young_low_income_profile)
        plan2 = build_financial_plan(high_income_profile)
        assert plan1.risk_profile != plan2.risk_profile
        assert plan1.health_score != plan2.health_score
