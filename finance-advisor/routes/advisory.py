"""Advisory routes — AI pipeline endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings, get_logger
from routes import db, ok

logger = get_logger("routes.advisory")
router = APIRouter(tags=["Advisory"])


class AdvisoryQuery(BaseModel):
    message: str
    session_id: str = "default"
    verify: bool = False


class AdvisoryReport(BaseModel):
    report: str
    session_id: str
    verification: str | None = None


class HealthStatus(BaseModel):
    status: str
    db_connected: bool
    catalog_loaded: bool


class StructuredRecommendation(BaseModel):
    id: str = ""
    name: str
    type: str
    return_pct: float
    rationale: str = ""
    min_credit: int = 0


class StructuredReport(BaseModel):
    session_id: str
    health_score: float
    risk_profile: str
    goals: list[str]
    plan_steps: list[str]
    recommendations: list[StructuredRecommendation]
    agent_commentary: str = ""
    report_markdown: str = ""


@router.post("/advise", response_model=AdvisoryReport)
def advise(q: AdvisoryQuery):
    """Run the full advisory pipeline and return a markdown report."""
    try:
        from agents.supervisor.agent import run_full_pipeline
        logger.info(f"Advise: session={q.session_id}")
        report = run_full_pipeline(q.message, q.session_id)
        verification = None
        if q.verify:
            from agents.verifier.agent import verify
            verification = verify(report)
        return AdvisoryReport(report=report, session_id=q.session_id, verification=verification)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advise/structured", response_model=StructuredReport)
def advise_structured(q: AdvisoryQuery):
    """Run the pipeline and return structured JSON for mobile apps."""
    try:
        from agents.profiling.agent import run as profile_user
        from tools.financial_intel.engine import build_financial_plan
        from tools.product_catalog.service import get_recommendations
        from tools.reporting.generator import generate_report
        from tools.profiling.service import load_session, normalize_profile_data
        from models.user import UserProfile

        logger.info(f"Structured advise: session={q.session_id}")
        
        profile_data = None
        profile_result = {}
        
        # 1. First, check if there's a completed step-by-step profile session
        session = load_session(q.session_id)
        if session and session.get("is_complete"):
            normalized = normalize_profile_data(session.get("collected_data", {}))
            # Fallbacks for missing non-critical fields
            normalized.setdefault("user_id", session.get("user_id", "user-demo-001"))
            normalized.setdefault("age", 30)
            normalized.setdefault("income", normalized.get("income", 50000))
            normalized.setdefault("credit_score", 700)
            normalized.setdefault("risk_tolerance", "medium")
            normalized.setdefault("job_stability", "stable")
            normalized.setdefault("goals", ["general"])
            profile_data = normalized
            profile_result["agent_response"] = "Based on the comprehensive profile you just built, here is my final analysis and recommendation set."
        else:
            # 2. Fallback to LLM extraction on the single message
            profile_result = profile_user(q.message)
            profile_data = profile_result.get("profile")

        if not profile_data:
            return StructuredReport(
                session_id=q.session_id,
                health_score=0.0,
                risk_profile="unknown",
                goals=[],
                plan_steps=[],
                recommendations=[],
                agent_commentary=profile_result.get("agent_response", "I could not extract your profile. Please provide your age, income, credit score, and financial goals."),
                report_markdown=""
            )

        profile = UserProfile(**profile_data) if isinstance(profile_data, dict) else profile_data
        assessment = build_financial_plan(profile)
        risk_value = assessment.risk_profile.value if hasattr(assessment.risk_profile, "value") else str(assessment.risk_profile)
        recs = get_recommendations(risk_value, profile.goals, profile.credit_score)
        report_md = generate_report(profile, assessment, recs)

        structured_recs = [
            StructuredRecommendation(
                id=r.get("id", ""),
                name=r.get("name", "Unknown"),
                type=r.get("type", "general"),
                return_pct=r.get("projected_return", 0.0),
                rationale=r.get("rationale", f"Matched for {risk_value} risk profile"),
                min_credit=r.get("min_credit_score", 0),
            )
            for r in recs
        ]

        return StructuredReport(
            session_id=q.session_id,
            health_score=assessment.health_score,
            risk_profile=risk_value,
            goals=[g if isinstance(g, str) else str(g) for g in profile.goals],
            plan_steps=assessment.plan_steps,
            recommendations=structured_recs,
            agent_commentary=profile_result.get("agent_response", ""),
            report_markdown=report_md,
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Structured pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=HealthStatus)
def health():
    db_ok = False
    catalog_ok = False
    try:
        _db = db()
        _db.execute("SELECT 1")
        db_ok = True
    except Exception:
        pass
    try:
        catalog_ok = settings.CATALOG_PATH.exists()
    except Exception:
        pass
    return HealthStatus(status="ok" if (db_ok and catalog_ok) else "degraded", db_connected=db_ok, catalog_loaded=catalog_ok)
