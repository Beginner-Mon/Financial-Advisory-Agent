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
