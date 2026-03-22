"""
Supervisor / Orchestrator Agent — Pure Python pipeline orchestrator.
Coordinates all agents in sequence: profile → assess → recommend → report.

Note: The supervisor is a deterministic Python orchestrator (no LLM).
Add LLM reasoning only when dynamic routing is needed.
"""

import json
from models.user import UserProfile
from config import get_logger

logger = get_logger(__name__)


def run_full_pipeline(user_message: str, session_id: str = "default") -> str:
    """
    Full advisory pipeline: profile → assess → recommend → report.

    Args:
        user_message: Natural language input from the user.
        session_id: Session ID for multi-turn conversations.

    Returns:
        Formatted Markdown report string.
    """
    from agents.profiling.agent import run as profile_user
    from agents.risk_planning.agent import run as assess_risk
    from agents.recommendation.agent import run as get_recs
    from tools.product_catalog.service import get_recommendations
    from tools.reporting.generator import generate_report

    # Step 1: Profile the user
    logger.info("[1/4] Profiling user...")
    profile_result = profile_user(user_message)

    # Extract the profile from the result
    profile_data = profile_result.get("profile")
    if profile_data is None:
        raise RuntimeError(
            "Profiling agent did not extract a profile. "
            f"Agent response: {profile_result.get('agent_response', 'N/A')}"
        )

    # Reconstruct UserProfile (handle enum serialization)
    if isinstance(profile_data, dict):
        profile = UserProfile(**profile_data)
    else:
        profile = profile_data

    logger.info(f"  Profile: {profile.user_id}, age={profile.age}, income={profile.income}")

    # Step 2: Assess risk and build financial plan
    logger.info("[2/4] Assessing risk and building plan...")
    assessment = assess_risk(profile)
    logger.info(
        f"  Score: {assessment.health_score}, "
        f"Risk: {assessment.risk_profile.value}"
    )

    # Step 3: Get product recommendations
    logger.info("[3/4] Fetching recommendations...")
    recs_text = get_recs(assessment, profile.goals, profile.credit_score)

    # Get raw product data for the report
    risk_value = assessment.risk_profile.value if hasattr(assessment.risk_profile, 'value') else assessment.risk_profile
    recs = get_recommendations(risk_value, profile.goals, profile.credit_score)

    # Step 4: Generate the report
    logger.info("[4/4] Generating report...")
    report = generate_report(profile, assessment, recs)

    logger.info(f"Pipeline complete for session={session_id}")
    return report
