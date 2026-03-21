"""
Shared pytest fixtures for the Finance Advisor test suite.
Provides reusable sample profiles, temp databases, and test helpers.
"""

import pytest
import json
import tempfile
from pathlib import Path
from models.user import UserProfile
from models.assessment import RiskAssessment
from models.enums import JobStability, RiskTolerance, RiskProfile


# ---------------------------------------------------------------------------
# Sample User Profiles (4 archetypes)
# ---------------------------------------------------------------------------

@pytest.fixture
def young_low_income_profile() -> UserProfile:
    """24-year-old, low income, wants emergency fund."""
    return UserProfile(
        user_id="test-young",
        age=24,
        income=35_000,
        credit_score=620,
        job_stability=JobStability.CONTRACT,
        risk_tolerance=RiskTolerance.LOW,
        goals=["emergency_fund"],
    )


@pytest.fixture
def high_income_profile() -> UserProfile:
    """42-year-old, high income, wants retirement planning."""
    return UserProfile(
        user_id="test-high",
        age=42,
        income=120_000,
        credit_score=780,
        job_stability=JobStability.STABLE,
        risk_tolerance=RiskTolerance.HIGH,
        goals=["retirement", "wealth"],
    )


@pytest.fixture
def self_employed_profile() -> UserProfile:
    """30-year-old, self-employed, wants to buy a house."""
    return UserProfile(
        user_id="test-self",
        age=30,
        income=60_000,
        credit_score=700,
        job_stability=JobStability.SELF_EMPLOYED,
        risk_tolerance=RiskTolerance.MEDIUM,
        goals=["house"],
    )


@pytest.fixture
def near_retirement_profile() -> UserProfile:
    """55-year-old, moderate income, retirement focus."""
    return UserProfile(
        user_id="test-retire",
        age=55,
        income=90_000,
        credit_score=750,
        job_stability=JobStability.STABLE,
        risk_tolerance=RiskTolerance.LOW,
        goals=["retirement", "emergency_fund"],
    )


# ---------------------------------------------------------------------------
# Temp Database
# ---------------------------------------------------------------------------

@pytest.fixture
def tmp_db_path(tmp_path) -> Path:
    """Provide a temporary SQLite DB path for isolation."""
    return tmp_path / "test.sqlite"


# ---------------------------------------------------------------------------
# Sample Product Catalog
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_catalog(tmp_path) -> Path:
    """Create a temp products.json with test data."""
    products = [
        {
            "id": "SAV-001",
            "name": "High-Yield Savings",
            "type": "savings",
            "min_credit": 0,
            "risk_level": "low",
            "return_pct": 4.5,
            "eligible_goals": ["emergency_fund", "house", "general"],
        },
        {
            "id": "SAV-002",
            "name": "Money Market Account",
            "type": "savings",
            "min_credit": 600,
            "risk_level": "low",
            "return_pct": 4.0,
            "eligible_goals": ["emergency_fund", "general"],
        },
        {
            "id": "INV-001",
            "name": "Diversified Index Fund",
            "type": "investment",
            "min_credit": 650,
            "risk_level": "moderate",
            "return_pct": 8.0,
            "eligible_goals": ["retirement", "wealth"],
        },
        {
            "id": "INV-002",
            "name": "Growth ETF Portfolio",
            "type": "investment",
            "min_credit": 700,
            "risk_level": "high",
            "return_pct": 12.0,
            "eligible_goals": ["wealth", "retirement"],
        },
        {
            "id": "INS-001",
            "name": "Term Life Insurance",
            "type": "insurance",
            "min_credit": 0,
            "risk_level": "low",
            "return_pct": None,
            "eligible_goals": ["emergency_fund", "retirement"],
        },
        {
            "id": "LN-001",
            "name": "Home Mortgage Pre-Approval",
            "type": "loan",
            "min_credit": 680,
            "risk_level": "moderate",
            "return_pct": None,
            "eligible_goals": ["house"],
        },
    ]
    catalog_path = tmp_path / "products.json"
    catalog_path.write_text(json.dumps(products, indent=2))
    return catalog_path


# ---------------------------------------------------------------------------
# Sample Assessment
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_assessment() -> RiskAssessment:
    """A moderate-risk assessment for testing."""
    return RiskAssessment(
        health_score=65.0,
        risk_profile=RiskProfile.MODERATE,
        liquidity_ratio=12_000.0,
        debt_ratio=0.30,
        plan_steps=[
            "Build a 3-month emergency fund.",
            "Open a dedicated high-yield savings account.",
        ],
    )
