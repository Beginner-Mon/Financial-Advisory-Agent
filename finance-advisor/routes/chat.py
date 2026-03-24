"""Chat & Profile Collection routes."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel
from config import get_logger
from routes import ok, err

logger = get_logger("routes.chat")
router = APIRouter(tags=["Chat & Profiling"])


class ChatMessage(BaseModel):
    message: str
    session_id: str = ""
    user_id: str = ""


@router.post("/chat")
def chat(body: ChatMessage):
    """
    Conversational entry point — detects intent and routes accordingly.
    If user wants financial advice → triggers step-by-step profiling.
    Otherwise → returns a general AI response.
    """
    from tools.profiling.service import (
        detect_profile_intent, create_session, load_session,
        get_step_info, PROFILE_STEPS,
    )

    user_id = body.user_id or "user-demo-001"

    if body.session_id:
        session = load_session(body.session_id)
        if session and not session.get("is_complete"):
            step_info = get_step_info(session.get("current_step"))
            return ok({
                "type": "profile_step",
                "session_id": body.session_id,
                "step_info": step_info,
                "message": "Let's continue building your financial profile.",
            })

    if detect_profile_intent(body.message):
        session = create_session(user_id)
        first_step = get_step_info(PROFILE_STEPS[0]["step"])
        return ok({
            "type": "profile_step",
            "session_id": session["session_id"],
            "step_info": first_step,
            "message": (
                "I'd love to help you with your finances! "
                "Let me ask a few questions to understand your situation. "
                "You can skip any question you'd rather not answer."
            ),
            "progress": {
                "filled": 0,
                "total": 6,
                "percentage": 0,
            },
        })

    try:
        from agents.base import run_agent
        response = run_agent(
            "You are a friendly financial advisor chatbot. Answer financial questions helpfully and concisely. "
            "If the user seems to want personalized advice, tell them you can build a financial profile for them.",
            body.message,
            tools=[],
            tool_fn_map={},
        )
        return ok({
            "type": "answer",
            "message": response,
        })
    except Exception as e:
        logger.error(f"Chat agent error: {e}")
        return ok({
            "type": "answer",
            "message": "I'm here to help with your finances! Tell me about your financial goals "
                       "and I'll create a personalized plan for you.",
        })


class ProfileStepRequest(BaseModel):
    session_id: str
    step: str
    values: dict = {}
    skip: bool = False


@router.post("/profile/step")
def profile_step(body: ProfileStepRequest):
    """Process one profiling step — record values or skip, return next step."""
    from tools.profiling.service import process_step as _process

    result = _process(body.session_id, body.step, body.values, body.skip)
    if "error" in result:
        err(result["error"], 404)

    if result.get("is_complete") or result.get("has_enough_info"):
        from tools.profiling.service import normalize_profile_data
        normalized = normalize_profile_data(result["collected_data"])

        normalized.setdefault("age", 30)
        normalized.setdefault("income", normalized.get("income", 50000))
        normalized.setdefault("credit_score", 700)
        normalized.setdefault("risk_tolerance", "medium")
        normalized.setdefault("job_stability", "stable")
        normalized.setdefault("goals", ["general"])

        result["normalized_profile"] = normalized

    return ok(result)


@router.get("/profile/progress/{session_id}")
def profile_progress(session_id: str):
    """Get current profiling session progress."""
    from tools.profiling.service import get_progress
    result = get_progress(session_id)
    if "error" in result:
        err(result["error"], 404)
    return ok(result)
