"""
Risk & Planning Agent — Analyzes a user profile to compute
health score, risk profile, and build a financial plan.
"""

import json
from agents.base import run_agent
from tools.financial_intel.engine import build_financial_plan
from models.user import UserProfile
from models.assessment import RiskAssessment
from config import get_logger

logger = get_logger(__name__)

TOOLS = [{
    "name": "analyze_financial_health",
    "description": "Compute financial health score, risk profile, and build a personalised financial plan "
                   "based on the user's profile data.",
    "input_schema": {
        "type": "object",
        "properties": {
            "user_profile_json": {
                "type": "string",
                "description": "JSON string of the user profile containing user_id, age, income, "
                               "credit_score, job_stability, risk_tolerance, goals, financial_holdings"
            },
            "include_scenarios": {
                "type": "boolean",
                "description": "Whether to include best/worst case scenario analysis",
                "default": False
            }
        },
        "required": ["user_profile_json"]
    }
}]

SYSTEM = """You are a financial risk analyst and planner.
Your job is to analyse a user's financial profile and provide insights.

Instructions:
1. Call analyze_financial_health with the user profile JSON.
2. After receiving results, interpret them in plain language:
   - Explain what the health score means for this person.
   - Justify the risk classification with specific reasons from their profile.
   - Add qualitative context to each plan step (why it matters for them).
3. Be honest about limitations — this is general guidance, not professional advice.
4. Keep your response structured and concise."""


def _analyze(user_profile_json: str, include_scenarios: bool = False) -> dict:
    """Tool function: compute financial plan from profile JSON."""
    profile = UserProfile(**json.loads(user_profile_json))
    assessment = build_financial_plan(profile)
    result = assessment.model_dump()
    # Convert enum to string for JSON serialization
    result["risk_profile"] = result["risk_profile"].value if hasattr(result["risk_profile"], 'value') else result["risk_profile"]
    return result


def run(profile: UserProfile) -> RiskAssessment:
    """
    Run the risk & planning agent.

    Args:
        profile: A validated UserProfile.

    Returns:
        RiskAssessment with health score, risk profile, and plan steps.
    """
    # Serialize profile for the tool, converting enums to values
    profile_data = profile.model_dump()
    for key in ("job_stability", "risk_tolerance"):
        if hasattr(profile_data[key], "value"):
            profile_data[key] = profile_data[key].value

    result_text = run_agent(
        SYSTEM,
        f"Analyse this user's financial profile and build a plan:\n\n{json.dumps(profile_data, indent=2)}",
        TOOLS,
        {"analyze_financial_health": _analyze}
    )

    # The tool already computed the assessment; rebuild it for consistency
    assessment = build_financial_plan(profile)
    logger.info(
        f"Risk agent completed for {profile.user_id}: "
        f"score={assessment.health_score}, risk={assessment.risk_profile.value}"
    )
    return assessment
