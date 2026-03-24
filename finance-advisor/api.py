"""
Finance Advisor API — FastAPI application factory.

Run:
    uvicorn api:app --reload --port 8000

All route handlers are organized into modular routers under the `routes/` package:
    routes/auth.py       — /auth/register, /auth/login
    routes/advisory.py   — /advise, /advise/structured, /health
    routes/banking.py    — /accounts, /cards, /transfers
    routes/products.py   — /products, /promotions
    routes/goals.py      — /goals
    routes/execution.py  — /execute/*, /orders, /traditional/apply
    routes/chat.py       — /chat, /profile/step, /profile/progress
    routes/recommend.py  — /recommend/prefill
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from config import settings, get_logger

logger = get_logger("api")

app = FastAPI(
    title="Agentic Finance Advisor API",
    description="AI-powered financial advisory system — full bank app backend",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup — run DB migrations
# ---------------------------------------------------------------------------

@app.on_event("startup")
def startup_event():
    from migrations import run_migrations
    run_migrations()
    logger.info("Startup complete — database migrations applied.")


# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        raise exc
    logger.error(f"Unhandled error: {exc}")
    is_dev = settings.JWT_SECRET_KEY == "dev-secret-change-in-production"
    error_msg = str(exc) if is_dev else "An internal error occurred. Please try again."
    return JSONResponse(
        status_code=500,
        content={"success": False, "data": None, "error": error_msg},
    )


# ---------------------------------------------------------------------------
# Register all routers
# ---------------------------------------------------------------------------

from routes.auth import router as auth_router
from routes.advisory import router as advisory_router
from routes.banking import router as banking_router
from routes.products import router as products_router
from routes.goals import router as goals_router
from routes.execution import router as execution_router
from routes.chat import router as chat_router
from routes.recommend import router as recommend_router

app.include_router(auth_router)
app.include_router(advisory_router)
app.include_router(banking_router)
app.include_router(products_router)
app.include_router(goals_router)
app.include_router(execution_router)
app.include_router(chat_router)
app.include_router(recommend_router)
