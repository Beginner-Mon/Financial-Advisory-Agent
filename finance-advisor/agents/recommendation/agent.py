"""
Recommendation Agent — Matches financial products to a user's
risk profile and goals using the Product Catalog Tool.
"""

import json
from agents.base import run_agent
from tools.product_catalog.service import get_recommendations
from models.assessment import RiskAssessment
from config import get_logger

logger = get_logger(__name__)

TOOLS = [{
    "name": "get_product_recommendations",
    "description": "Fetch eligible financial products matching the user's risk profile, "
                   "goals, and credit score from the product catalog.",
    "input_schema": {
        "type": "object",
        "properties": {
            "risk_profile":  {"type": "string", "enum": ["conservative", "moderate", "aggressive"],
                              "description": "User's computed risk profile"},
            "goals":         {"type": "array", "items": {"type": "string"},
                              "description": "User's financial goals"},
            "credit_score":  {"type": "integer",
                              "description": "User's credit score for eligibility filtering"},
            "max_results":   {"type": "integer", "default": 5,
                              "description": "Maximum number of products to return"}
        },
        "required": ["risk_profile", "goals"]
    }
}]

SYSTEM = """You are a financial product advisor.
Your job is to recommend suitable financial products based on the user's risk profile and goals.

Instructions:
1. Call get_product_recommendations with the user's risk profile, goals, and credit score.
2. Review the returned products and rank them by relevance to the user's goals.
3. For each product, write a 1-sentence rationale tied to the user's specific situation.
4. Never recommend more than 5 products.
5. Always note any eligibility requirements or limitations.
6. Be transparent — don't oversell returns or downplay risks.
7. Keep your response concise and actionable."""


def _fetch(
    risk_profile: str,
    goals: list[str],
    credit_score: int = 700,
    max_results: int = 5,
) -> list[dict]:
    """Tool function: fetch matching products from the catalog."""
    return get_recommendations(risk_profile, goals, credit_score)[:max_results]


def run(
    assessment: RiskAssessment,
    goals: list[str],
    credit_score: int = 700,
) -> str:
    """
    Run the recommendation agent.

    Args:
        assessment: The user's RiskAssessment.
        goals: The user's financial goals.
        credit_score: The user's credit score.

    Returns:
        The agent's text response with product recommendations.
    """
    risk_value = assessment.risk_profile.value if hasattr(assessment.risk_profile, 'value') else assessment.risk_profile

    result = run_agent(
        SYSTEM,
        f"Find suitable products for a user with:\n"
        f"- Risk profile: {risk_value}\n"
        f"- Health score: {assessment.health_score}\n"
        f"- Goals: {goals}\n"
        f"- Credit score: {credit_score}",
        TOOLS,
        {"get_product_recommendations": _fetch}
    )

    logger.info(f"Recommendation agent completed: risk={risk_value}, goals={goals}")
    return result
