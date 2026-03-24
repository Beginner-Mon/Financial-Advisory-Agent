"""
Profile Collection Service — Step-by-step profiling with "enough info" threshold.

Implements the core requirements from agent_backend_plan.md:
  - Step-by-step questioning (one group at a time)
  - Skip support for any step
  - "Enough info" threshold for early recommendations
  - Partial profile notes
  - Session persistence across steps
"""

from __future__ import annotations
import json
import uuid
from datetime import datetime
from typing import Any, Optional

import sqlite_utils
from config import settings, get_logger

logger = get_logger("profiling_service")


# ---------------------------------------------------------------------------
# Profiling steps — ordered groups of questions
# ---------------------------------------------------------------------------

PROFILE_STEPS = [
    {
        "step": "income",
        "group": "Income & Employment",
        "questions": [
            {"field": "income", "prompt": "What is your annual income (in USD)?", "type": "number", "required": True},
            {"field": "job_stability", "prompt": "What best describes your employment?", "type": "choice",
             "options": ["Stable full-time", "Contract/freelance", "Self-employed"], "required": False},
        ],
    },
    {
        "step": "goals",
        "group": "Financial Goals",
        "questions": [
            {"field": "goals", "prompt": "What are your main financial goals?", "type": "multi_choice",
             "options": ["Emergency fund", "Buy a house", "Retirement", "Grow wealth", "Pay off debt", "Education"],
             "required": True},
        ],
    },
    {
        "step": "risk",
        "group": "Risk & Preferences",
        "questions": [
            {"field": "risk_tolerance", "prompt": "How would you describe your risk tolerance?", "type": "choice",
             "options": ["Low — preserve capital", "Medium — balanced growth", "High — maximize returns"],
             "required": False},
            {"field": "age", "prompt": "How old are you?", "type": "number", "required": False},
        ],
    },
    {
        "step": "credit",
        "group": "Credit & Financial Health",
        "questions": [
            {"field": "credit_score", "prompt": "What is your credit score (300-850)? If unsure, you can skip.",
             "type": "number", "required": False},
        ],
    },
]


# ---------------------------------------------------------------------------
# Minimum fields for recommendations
# ---------------------------------------------------------------------------

MINIMUM_REQUIRED_FIELDS = {"income", "goals"}
ALL_PROFILE_FIELDS = {"income", "job_stability", "goals", "risk_tolerance", "age", "credit_score"}


def _db() -> sqlite_utils.Database:
    return sqlite_utils.Database(str(settings.DB_PATH))


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------

def create_session(user_id: str) -> dict:
    """Create a new profiling session."""
    db = _db()
    session_id = f"prof-{uuid.uuid4().hex[:8]}"
    now = datetime.now().isoformat()

    session = {
        "session_id": session_id,
        "user_id": user_id,
        "collected_data": json.dumps({}),
        "current_step": PROFILE_STEPS[0]["step"],
        "is_complete": 0,
        "created_at": now,
        "updated_at": now,
    }
    db["profile_sessions"].upsert(session, pk="session_id")
    return session


def load_session(session_id: str) -> dict | None:
    """Load an existing profiling session."""
    db = _db()
    try:
        row = dict(db["profile_sessions"].get(session_id))
        if isinstance(row.get("collected_data"), str):
            row["collected_data"] = json.loads(row["collected_data"])
        return row
    except Exception:
        return None


def save_session(session_id: str, collected_data: dict, current_step: str, is_complete: bool = False):
    """Save profiling session progress."""
    db = _db()
    db["profile_sessions"].update(session_id, {
        "collected_data": json.dumps(collected_data),
        "current_step": current_step,
        "is_complete": 1 if is_complete else 0,
        "updated_at": datetime.now().isoformat(),
    })


# ---------------------------------------------------------------------------
# Step processing
# ---------------------------------------------------------------------------

def get_step_info(step_name: str) -> dict | None:
    """Get step configuration by name."""
    return next((s for s in PROFILE_STEPS if s["step"] == step_name), None)


def get_step_index(step_name: str) -> int:
    """Get the index of a step."""
    for i, s in enumerate(PROFILE_STEPS):
        if s["step"] == step_name:
            return i
    return -1


def get_next_step(current_step: str) -> str | None:
    """Get the next step after the current one, or None if done."""
    idx = get_step_index(current_step)
    if idx < 0 or idx >= len(PROFILE_STEPS) - 1:
        return None
    return PROFILE_STEPS[idx + 1]["step"]


def process_step(session_id: str, step: str, values: dict | None = None, skip: bool = False) -> dict:
    """
    Process a profiling step: record values (or skip) and return the next step.

    Returns:
        {
            "session_id": str,
            "current_step": str | None,
            "step_info": dict | None,
            "progress": { filled, total, percentage },
            "has_enough_info": bool,
            "is_complete": bool,
            "collected_data": dict,
            "partial_note": str | None,
        }
    """
    session = load_session(session_id)
    if not session:
        return {"error": "Session not found"}

    collected = session.get("collected_data", {})

    # Record values if not skipping
    if not skip and values:
        for field, value in values.items():
            if field in ALL_PROFILE_FIELDS and value is not None:
                collected[field] = value

    # Determine next step
    next_step = get_next_step(step)
    is_complete = next_step is None

    # Save progress
    save_session(session_id, collected, next_step or step, is_complete)

    # Compute completeness
    filled_fields = set(collected.keys()) & ALL_PROFILE_FIELDS
    has_enough = MINIMUM_REQUIRED_FIELDS.issubset(filled_fields)
    progress = {
        "filled": len(filled_fields),
        "total": len(ALL_PROFILE_FIELDS),
        "percentage": round(len(filled_fields) / len(ALL_PROFILE_FIELDS) * 100),
        "filled_fields": list(filled_fields),
        "missing_fields": list(ALL_PROFILE_FIELDS - filled_fields),
    }

    # Next step info
    step_info = get_step_info(next_step) if next_step else None

    # Partial profile note
    partial_note = None
    if has_enough and not is_complete:
        partial_note = (
            "You've provided enough info for initial recommendations! "
            "Continue to refine your profile for more accurate suggestions."
        )
    elif is_complete and not has_enough:
        partial_note = (
            "⚠️ Your profile is incomplete. These suggestions may not fully "
            "reflect your situation. Update your profile for better results."
        )

    return {
        "session_id": session_id,
        "current_step": next_step,
        "step_info": step_info,
        "progress": progress,
        "has_enough_info": has_enough,
        "is_complete": is_complete,
        "collected_data": collected,
        "partial_note": partial_note,
    }


def get_progress(session_id: str) -> dict:
    """Get current profiling session progress."""
    session = load_session(session_id)
    if not session:
        return {"error": "Session not found"}

    collected = session.get("collected_data", {})
    filled_fields = set(collected.keys()) & ALL_PROFILE_FIELDS
    has_enough = MINIMUM_REQUIRED_FIELDS.issubset(filled_fields)
    current_step = session.get("current_step")
    step_info = get_step_info(current_step) if current_step else None

    return {
        "session_id": session_id,
        "current_step": current_step,
        "step_info": step_info,
        "progress": {
            "filled": len(filled_fields),
            "total": len(ALL_PROFILE_FIELDS),
            "percentage": round(len(filled_fields) / len(ALL_PROFILE_FIELDS) * 100),
            "filled_fields": list(filled_fields),
            "missing_fields": list(ALL_PROFILE_FIELDS - filled_fields),
        },
        "has_enough_info": has_enough,
        "is_complete": bool(session.get("is_complete")),
        "collected_data": collected,
    }


# ---------------------------------------------------------------------------
# Intent detection (for the /chat endpoint)
# ---------------------------------------------------------------------------

# Keywords that suggest the user wants to build a financial profile
PROFILE_INTENT_KEYWORDS = [
    "financial advice", "recommend", "suggestion", "plan",
    "invest", "save", "budget", "retire", "house", "mortgage",
    "loan", "insurance", "credit card", "wealth", "portfolio",
    "income", "salary", "risk", "goals", "my finances",
    "help me", "advise", "profile", "assess",
]


import re

def detect_profile_intent(message: str) -> bool:
    """
    Check if the user's message suggests they want to build a financial profile.
    Returns True if profiling should be triggered.
    """
    lower = message.lower()
    for kw in PROFILE_INTENT_KEYWORDS:
        if re.search(r'\b' + re.escape(kw) + r'\b', lower):
            return True
    return False


# ---------------------------------------------------------------------------
# Normalize collected data → UserProfile format
# ---------------------------------------------------------------------------

GOAL_MAPPING = {
    "Emergency fund": "emergency_fund",
    "Buy a house": "house",
    "Retirement": "retirement",
    "Grow wealth": "wealth",
    "Pay off debt": "debt",
    "Education": "education",
}

RISK_MAPPING = {
    "Low — preserve capital": "low",
    "Medium — balanced growth": "medium",
    "High — maximize returns": "high",
}

JOB_MAPPING = {
    "Stable full-time": "stable",
    "Contract/freelance": "contract",
    "Self-employed": "self-employed",
}


def normalize_profile_data(collected: dict) -> dict:
    """Convert user-friendly values to system values for the profile."""
    result = {}

    if "income" in collected:
        result["income"] = float(collected["income"])

    if "age" in collected:
        result["age"] = int(collected["age"])

    if "credit_score" in collected:
        result["credit_score"] = int(collected["credit_score"])

    if "goals" in collected:
        goals = collected["goals"]
        if isinstance(goals, list):
            result["goals"] = [GOAL_MAPPING.get(g, g.lower().replace(" ", "_")) for g in goals]
        else:
            result["goals"] = [GOAL_MAPPING.get(goals, goals.lower().replace(" ", "_"))]

    if "risk_tolerance" in collected:
        result["risk_tolerance"] = RISK_MAPPING.get(collected["risk_tolerance"], "medium")

    if "job_stability" in collected:
        result["job_stability"] = JOB_MAPPING.get(collected["job_stability"], "stable")

    return result
