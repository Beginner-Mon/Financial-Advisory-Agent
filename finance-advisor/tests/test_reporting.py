"""Unit tests for the Reporting Tool."""

import pytest
from models.user import UserProfile
from models.assessment import RiskAssessment
from models.enums import RiskProfile
from tools.reporting.generator import generate_report


class TestGenerateReport:
    """Test report content and structure."""

    def test_contains_all_sections(
        self, high_income_profile, sample_assessment
    ):
        recs = [
            {"name": "Test Fund", "type": "investment", "return_pct": 8.0},
            {"name": "Savings Acct", "type": "savings", "return_pct": 4.5},
        ]
        report = generate_report(high_income_profile, sample_assessment, recs)

        assert "# Financial Advisory Report" in report
        assert "Financial Health Score" in report
        assert "Risk Profile" in report
        assert "Your Goals" in report
        assert "Financial Plan" in report
        assert "Recommended Products" in report
        assert "65/100" in report  # sample_assessment.health_score

    def test_health_score_bar(self, high_income_profile, sample_assessment):
        report = generate_report(high_income_profile, sample_assessment, [])
        assert "█" in report
        assert "░" in report

    def test_empty_recommendations(self, high_income_profile, sample_assessment):
        report = generate_report(high_income_profile, sample_assessment, [])
        assert "No products matched" in report

    def test_empty_plan_steps(self, high_income_profile):
        assessment = RiskAssessment(
            health_score=50.0,
            risk_profile=RiskProfile.MODERATE,
            liquidity_ratio=10_000,
            debt_ratio=0.3,
            plan_steps=[],
        )
        report = generate_report(high_income_profile, assessment, [])
        assert "No specific plan steps" in report

    def test_recommendations_with_returns(self, high_income_profile, sample_assessment):
        recs = [{"name": "Index Fund", "type": "investment", "return_pct": 8.0}]
        report = generate_report(high_income_profile, sample_assessment, recs)
        assert "8.0% projected return" in report

    def test_recommendations_without_returns(self, high_income_profile, sample_assessment):
        recs = [{"name": "Insurance", "type": "insurance"}]
        report = generate_report(high_income_profile, sample_assessment, recs)
        assert "Insurance" in report
        assert "projected return" not in report  # No return_pct

    def test_goals_displayed(self, self_employed_profile, sample_assessment):
        report = generate_report(self_employed_profile, sample_assessment, [])
        assert "House" in report  # "house" → "House" (title case)
