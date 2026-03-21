"""
Financial Intelligence Tool — Pure Python computation engine.
No AI calls. Health scoring, risk profiling, and plan generation.
"""

from models.user import UserProfile
from models.assessment import RiskAssessment
from models.enums import RiskProfile, RiskTolerance, JobStability
from config import get_logger

logger = get_logger(__name__)


def compute_health_score(p: UserProfile) -> float:
    """
    Compute a financial health score (0–100) based on:
    - Credit score contribution (0–25 pts)
    - Income contribution (0–20 pts)
    - Job stability contribution (0–10 pts)
    - Base score: 50 pts
    """
    score = 50.0

    # Credit score component (max 25 pts)
    if p.credit_score >= 750:
        score += 25
    elif p.credit_score >= 700:
        score += 15
    elif p.credit_score >= 650:
        score += 5
    elif p.credit_score < 600:
        score -= 10  # Penalty for very low credit

    # Income component (max 20 pts)
    if p.income >= 100_000:
        score += 20
    elif p.income >= 60_000:
        score += 12
    elif p.income >= 40_000:
        score += 5
    elif p.income < 20_000:
        score -= 5  # Penalty for very low income

    # Job stability component (max 10 pts)
    if p.job_stability == JobStability.STABLE:
        score += 10
    elif p.job_stability == JobStability.CONTRACT:
        score += 5
    # self-employed gets 0 bonus

    return min(max(round(score, 1), 0.0), 100.0)


def compute_risk_profile(p: UserProfile) -> RiskProfile:
    """
    Determine risk profile based on health score and stated risk tolerance.
    High score + high tolerance = aggressive
    Low score or low tolerance = conservative
    """
    score = compute_health_score(p)

    if score >= 75 and p.risk_tolerance == RiskTolerance.HIGH:
        return RiskProfile.AGGRESSIVE
    elif score >= 50 or p.risk_tolerance == RiskTolerance.MEDIUM:
        return RiskProfile.MODERATE
    return RiskProfile.CONSERVATIVE


def generate_plan_steps(p: UserProfile, risk: RiskProfile) -> list[str]:
    """Generate actionable financial plan steps based on profile and risk level."""
    steps = []

    # Credit improvement
    if p.credit_score < 680:
        steps.append("Pay down credit card balances to below 30% utilisation.")
    if p.credit_score < 600:
        steps.append("Consider a secured credit card to rebuild credit history.")

    # Emergency fund
    if "emergency_fund" in p.goals:
        months = 6 if risk == RiskProfile.CONSERVATIVE else 3
        target = p.income / 12 * months
        steps.append(
            f"Build a {months}-month emergency fund (~${target:,.0f})."
        )

    # House goal
    if "house" in p.goals:
        down_payment = p.income * 3 * 0.20  # 20% of 3x income
        steps.append(
            f"Open a dedicated high-yield savings account for your down payment (~${down_payment:,.0f})."
        )

    # Retirement goal
    if "retirement" in p.goals:
        if risk == RiskProfile.AGGRESSIVE:
            steps.append(
                "Maximise contributions to tax-advantaged investment accounts (401k, IRA)."
            )
        else:
            steps.append(
                "Begin regular contributions to a diversified retirement fund."
            )

    # Wealth building
    if "wealth" in p.goals and risk in (RiskProfile.MODERATE, RiskProfile.AGGRESSIVE):
        steps.append(
            "Consider a diversified portfolio of index funds for long-term growth."
        )

    # General advice based on income
    if p.income < 40_000:
        steps.append("Explore ways to increase income through skills training or side work.")

    if not steps:
        steps.append("Maintain your current financial habits and review quarterly.")

    return steps


def build_financial_plan(p: UserProfile) -> RiskAssessment:
    """
    Full financial plan: compute health score, determine risk profile,
    generate plan steps, and return a complete RiskAssessment.
    """
    health = compute_health_score(p)
    risk = compute_risk_profile(p)
    steps = generate_plan_steps(p, risk)

    assessment = RiskAssessment(
        health_score=health,
        risk_profile=risk,
        liquidity_ratio=round(p.income * 0.2, 2),
        debt_ratio=0.30,
        plan_steps=steps,
    )

    logger.info(
        f"Built plan for {p.user_id}: score={health}, risk={risk.value}, "
        f"steps={len(steps)}"
    )
    return assessment
