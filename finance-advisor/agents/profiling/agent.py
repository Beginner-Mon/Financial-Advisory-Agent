"""
Profiling Agent — Extracts financial profile from natural language input,
validates, enriches, and persists to SQLite via the User Profile Tool.
"""

import json
import uuid
from agents.base import run_agent
from tools.user_profile.service import validate_and_enrich, save_profile
from models.user import UserProfile
from config import get_logger

logger = get_logger(__name__)

TOOLS = [{
    "name": "save_user_profile",
    "description": "Validate, enrich and save a user's financial profile to the database. "
                   "Extract all financial details from the user's message and call this tool.",
    "input_schema": {
        "type": "object",
        "properties": {
            "age":            {"type": "integer", "description": "User's age in years"},
            "income":         {"type": "number",  "description": "Annual income in USD"},
            "credit_score":   {"type": "integer", "description": "Credit score 300-850"},
            "job_stability":  {"type": "string",  "enum": ["stable", "contract", "self-employed"],
                               "description": "Employment stability"},
            "risk_tolerance": {"type": "string",  "enum": ["low", "medium", "high"],
                               "description": "User's risk tolerance"},
            "goals":          {"type": "array",   "items": {"type": "string"},
                               "description": "Financial goals, e.g. emergency_fund, house, retirement, wealth"}
        },
        "required": ["age", "income", "credit_score", "goals"]
    }
}]

SYSTEM = """You are a financial profiling assistant.
Your job is to extract the user's financial details from their message and call save_user_profile.

Instructions:
- Extract: age, income, credit_score, goals from the user's message.
- If job_stability is not mentioned, default to "stable".
- If risk_tolerance is not mentioned, infer from context (young + aggressive language → "high", conservative language → "low", otherwise "medium").
- Normalize goals to standard keys: emergency_fund, house, retirement, wealth, general.
- If a required field is truly missing and cannot be inferred, make a reasonable assumption and note it.
- After saving, confirm the profile details and any assumptions made.
- Keep your response concise."""


def _save(
    age: int,
    income: float,
    credit_score: int,
    goals: list[str],
    job_stability: str = "stable",
    risk_tolerance: str = "medium",
) -> dict:
    """Tool function: validate, enrich, and save profile."""
    user_id = str(uuid.uuid4())[:8]
    profile = validate_and_enrich({
        "user_id": user_id,
        "age": age,
        "income": income,
        "credit_score": credit_score,
        "job_stability": job_stability,
        "risk_tolerance": risk_tolerance,
        "goals": goals,
    })
    save_profile(profile)
    logger.info(f"Profiling agent saved user {user_id}")
    return profile.model_dump()


def run(user_input: str) -> dict:
    """
    Run the profiling agent: extract profile from text, save to DB.

    Returns:
        dict with the saved profile data and the agent's text response.
    """
    # We track the last saved profile via closure
    saved_profiles = []

    def _save_and_track(**kwargs) -> dict:
        result = _save(**kwargs)
        saved_profiles.append(result)
        return result

    text = run_agent(
        SYSTEM, user_input, TOOLS,
        {"save_user_profile": _save_and_track}
    )

    if saved_profiles:
        return {
            "profile": saved_profiles[-1],
            "agent_response": text,
        }

    # Fallback: if agent didn't call tool, return just the text
    return {
        "profile": None,
        "agent_response": text,
    }
