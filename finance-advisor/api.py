"""
Finance Advisor API — FastAPI HTTP layer for the advisory pipeline.

Run:
    uvicorn api:app --reload

Endpoints:
    POST /advise  — Run the advisory pipeline
    GET  /health  — Health check with DB connectivity
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import settings, get_logger

logger = get_logger("api")

app = FastAPI(
    title="Agentic Finance Advisor API",
    description="AI-powered financial advisory system",
    version="0.1.0",
)

# CORS middleware for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class AdvisoryQuery(BaseModel):
    """Request body for the /advise endpoint."""
    message: str
    session_id: str = "default"
    verify: bool = False


class AdvisoryReport(BaseModel):
    """Response body for the /advise endpoint."""
    report: str
    session_id: str
    verification: str | None = None


class HealthStatus(BaseModel):
    """Response body for the /health endpoint."""
    status: str
    db_connected: bool
    catalog_loaded: bool


# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}")
    raise HTTPException(
        status_code=500,
        detail=f"Internal server error: {str(exc)}",
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/advise", response_model=AdvisoryReport)
def advise(q: AdvisoryQuery):
    """Run the full advisory pipeline and return a report."""
    try:
        from agents.supervisor.agent import run_full_pipeline

        logger.info(f"Advise request: session={q.session_id}, message='{q.message[:60]}'")
        report = run_full_pipeline(q.message, q.session_id)

        verification = None
        if q.verify:
            from agents.verifier.agent import verify
            verification = verify(report)

        return AdvisoryReport(
            report=report,
            session_id=q.session_id,
            verification=verification,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health", response_model=HealthStatus)
def health():
    """Health check with DB and catalog connectivity."""
    db_ok = False
    catalog_ok = False

    try:
        import sqlite_utils
        db = sqlite_utils.Database(str(settings.DB_PATH))
        db.execute("SELECT 1")
        db_ok = True
    except Exception:
        pass

    try:
        catalog_ok = settings.CATALOG_PATH.exists()
    except Exception:
        pass

    return HealthStatus(
        status="ok" if (db_ok and catalog_ok) else "degraded",
        db_connected=db_ok,
        catalog_loaded=catalog_ok,
    )


# ---------------------------------------------------------------------------
# Structured endpoint for mobile app
# ---------------------------------------------------------------------------

class StructuredRecommendation(BaseModel):
    name: str
    type: str
    return_pct: float
    rationale: str = ""
    min_credit: int = 0


class StructuredReport(BaseModel):
    """Parsed advisory data for mobile app rendering."""
    session_id: str
    health_score: float
    risk_profile: str
    goals: list[str]
    plan_steps: list[str]
    recommendations: list[StructuredRecommendation]
    agent_commentary: str = ""
    report_markdown: str = ""


@app.post("/advise/structured", response_model=StructuredReport)
def advise_structured(q: AdvisoryQuery):
    """Run the pipeline and return structured JSON for mobile apps."""
    try:
        from agents.profiling.agent import run as profile_user
        from tools.financial_intel.engine import build_financial_plan
        from tools.product_catalog.service import get_recommendations
        from tools.reporting.generator import generate_report
        from models.user import UserProfile

        logger.info(f"Structured advise: session={q.session_id}, message='{q.message[:60]}'")

        # Step 1: Profile
        profile_result = profile_user(q.message)
        profile_data = profile_result.get("profile")
        if not profile_data:
            raise HTTPException(status_code=400, detail="Could not extract financial profile from input.")

        profile = UserProfile(**profile_data) if isinstance(profile_data, dict) else profile_data

        # Step 2: Assess
        assessment = build_financial_plan(profile)
        risk_value = assessment.risk_profile.value if hasattr(assessment.risk_profile, 'value') else str(assessment.risk_profile)

        # Step 3: Recommend
        recs = get_recommendations(risk_value, profile.goals, profile.credit_score)

        # Step 4: Report
        report_md = generate_report(profile, assessment, recs)

        # Build structured response
        structured_recs = []
        for r in recs:
            structured_recs.append(StructuredRecommendation(
                name=r.get("name", "Unknown"),
                type=r.get("type", "general"),
                return_pct=r.get("projected_return", 0.0),
                rationale=r.get("rationale", f"Matched for {risk_value} risk profile"),
                min_credit=r.get("min_credit_score", 0),
            ))

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

