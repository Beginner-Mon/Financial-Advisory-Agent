"""Smart pre-fill routes — AI-powered product recommendations."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel
from config import get_logger
from routes import ok

logger = get_logger("routes.recommend")
router = APIRouter(tags=["Recommendations"])


class PrefillRequest(BaseModel):
    user_id: str = ""
    product_id: str = ""
    product_type: str


@router.post("/recommend/prefill")
def recommend_prefill(body: PrefillRequest):
    """
    Generate AI-powered pre-fill suggestions for a product application.
    Returns editable suggested values based on the user's profile.
    """
    profile = {}
    if body.user_id:
        try:
            from tools.user_profile.service import get_profile
            profile = get_profile(body.user_id)
            if not isinstance(profile, dict):
                profile = {}
        except Exception:
            pass

    income = profile.get("income", 50000)
    age = profile.get("age", 30)
    credit_score = profile.get("credit_score", 700)
    monthly_income = income / 12

    suggestions = {}

    if body.product_type == "savings":
        suggestions = {
            "target_amount": round(monthly_income * 3, -2),
            "monthly_deposit": round(monthly_income * 0.1, -1),
            "timeline_months": 12,
            "ai_note": f"Based on your income, we suggest saving 3 months of expenses (~${round(monthly_income * 3, -2):,.0f}).",
        }

    elif body.product_type == "loan":
        max_loan = income * 5 if credit_score >= 700 else income * 3
        suggestions = {
            "loan_amount": round(max_loan, -3),
            "tenure_months": 60,
            "monthly_repayment": round(max_loan / 60 * 1.05, -1),
            "ai_note": f"With your credit profile, you may qualify for up to ${max_loan:,.0f}.",
        }

    elif body.product_type == "insurance":
        coverage = income * 10
        suggestions = {
            "coverage_amount": round(coverage, -3),
            "payment_frequency": "monthly",
            "monthly_premium": round(coverage * 0.002 / 12, -1),
            "ai_note": f"We recommend coverage of 10× your annual income (~${coverage:,.0f}).",
        }

    elif body.product_type == "investment":
        risk = profile.get("risk_tolerance", "medium")
        starting = round(monthly_income * 0.05, -1)
        allocation = {
            "low": {"bonds": 70, "stocks": 20, "cash": 10},
            "medium": {"bonds": 40, "stocks": 50, "cash": 10},
            "high": {"bonds": 10, "stocks": 80, "cash": 10},
        }.get(risk, {"bonds": 40, "stocks": 50, "cash": 10})
        suggestions = {
            "starting_amount": starting,
            "monthly_contribution": starting,
            "risk_level": risk,
            "allocation": allocation,
            "ai_note": f"Based on your {risk} risk profile, we suggest a balanced allocation.",
        }

    elif body.product_type == "card":
        tier = "platinum" if income >= 100000 else "gold" if income >= 60000 else "classic"
        limit = round(monthly_income * 2, -2)
        suggestions = {
            "card_tier": tier,
            "credit_limit": limit,
            "ai_note": f"Based on your income, we recommend the {tier.capitalize()} tier with a ${limit:,.0f} limit.",
        }

    else:
        suggestions = {
            "ai_note": "We couldn't generate specific suggestions for this product type.",
        }

    return ok({
        "product_type": body.product_type,
        "suggestions": suggestions,
        "is_ai_generated": True,
        "editable": True,
        "badge": "🤖 AI Suggested",
    })
