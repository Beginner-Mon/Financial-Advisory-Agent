"""
Finance Advisor API — FastAPI HTTP layer.

Run:
    uvicorn api:app --reload --port 8000

Endpoints (Phase 3 — AI advisory):
    POST /advise                   — full AI pipeline
    POST /advise/structured        — structured JSON for mobile
    GET  /health                   — health check

Endpoints (Phase 5 — Bank core):
    GET    /accounts/{user_id}
    GET    /accounts/{account_id}/txns
    GET    /cards/{user_id}
    PATCH  /cards/{card_id}/freeze
    POST   /transfers
    POST   /transfers/{transfer_id}/confirm

Endpoints (Phase 5 — Discover / Products):
    GET    /products
    GET    /products/{product_id}
    POST   /products/compare
    GET    /promotions
    POST   /promotions/{promo_id}/activate

Endpoints (Phase 5 — Goals):
    GET    /goals/{user_id}
    POST   /goals
    PATCH  /goals/{goal_id}
    DELETE /goals/{goal_id}

Endpoints (Phase 6 — Execution):
    POST   /execute/start
    POST   /execute/resume
    GET    /execute/progress/{session_id}
    DELETE /execute/cancel/{session_id}
    GET    /orders/{user_id}
    GET    /agent-history/{user_id}
"""

from __future__ import annotations
import json
import uuid
from datetime import datetime, timedelta
from typing import Any, Optional

import sqlite_utils
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from config import settings, get_logger

logger = get_logger("api")

app = FastAPI(
    title="Agentic Finance Advisor API",
    description="AI-powered financial advisory system — full bank app backend",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _db() -> sqlite_utils.Database:
    return sqlite_utils.Database(str(settings.DB_PATH))


def _ok(data: Any) -> dict:
    return {"success": True, "data": data, "error": None}


def _err(msg: str, status: int = 400):
    raise HTTPException(status_code=status, detail={"success": False, "data": None, "error": msg})


def _load_products() -> list[dict]:
    with open(str(settings.CATALOG_PATH), "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    if isinstance(exc, HTTPException):
        raise exc
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "data": None, "error": str(exc)},
    )


# ===========================================================================
# PHASE 3 — AI Advisory Endpoints (preserved from original)
# ===========================================================================

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


@app.post("/advise", response_model=AdvisoryReport)
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


class StructuredRecommendation(BaseModel):
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


@app.post("/advise/structured", response_model=StructuredReport)
def advise_structured(q: AdvisoryQuery):
    """Run the pipeline and return structured JSON for mobile apps."""
    try:
        from agents.profiling.agent import run as profile_user
        from tools.financial_intel.engine import build_financial_plan
        from tools.product_catalog.service import get_recommendations
        from tools.reporting.generator import generate_report
        from models.user import UserProfile

        logger.info(f"Structured advise: session={q.session_id}")
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


@app.get("/health", response_model=HealthStatus)
def health():
    db_ok = False
    catalog_ok = False
    try:
        db = _db()
        db.execute("SELECT 1")
        db_ok = True
    except Exception:
        pass
    try:
        catalog_ok = settings.CATALOG_PATH.exists()
    except Exception:
        pass
    return HealthStatus(status="ok" if (db_ok and catalog_ok) else "degraded", db_connected=db_ok, catalog_loaded=catalog_ok)


# ===========================================================================
# PHASE 5 — Bank Core Endpoints
# ===========================================================================

@app.get("/accounts/{user_id}")
def get_accounts(user_id: str):
    """List all accounts + balances for a user."""
    db = _db()
    try:
        rows = list(db["accounts"].rows_where("user_id = ?", [user_id]))
    except Exception:
        rows = []
    return _ok(rows)


@app.get("/accounts/{account_id}/txns")
def get_transactions(
    account_id: str,
    page: int = 1,
    limit: int = 20,
    category: str = "",
    search: str = "",
):
    """Paginated transaction history with optional filters."""
    db = _db()
    try:
        where = "account_id = ?"
        params: list = [account_id]
        if category:
            where += " AND category = ?"
            params.append(category)
        if search:
            where += " AND (merchant LIKE ? OR reference LIKE ?)"
            params += [f"%{search}%", f"%{search}%"]

        all_rows = list(db["transactions"].rows_where(where, params, order_by="date DESC"))
        total = len(all_rows)
        start = (page - 1) * limit
        rows = all_rows[start : start + limit]
    except Exception:
        rows, total = [], 0

    return _ok({"transactions": rows, "total": total, "page": page, "limit": limit})


@app.get("/cards/{user_id}")
def get_cards(user_id: str):
    """List all cards for a user."""
    db = _db()
    try:
        rows = list(db["cards"].rows_where("user_id = ?", [user_id]))
    except Exception:
        rows = []
    return _ok(rows)


class FreezeCardBody(BaseModel):
    freeze: bool


@app.patch("/cards/{card_id}/freeze")
def freeze_card(card_id: str, body: FreezeCardBody):
    """Freeze or unfreeze a card."""
    db = _db()
    try:
        card = dict(db["cards"].get(card_id))
        card["status"] = "frozen" if body.freeze else "active"
        db["cards"].upsert(card, pk="card_id")
        return _ok(card)
    except Exception as e:
        _err(f"Card not found: {card_id}", 404)


class TransferBody(BaseModel):
    from_account: str
    to_account: str
    amount: float
    reference: str = ""
    user_id: str = "user-demo-001"


@app.post("/transfers")
def initiate_transfer(body: TransferBody):
    """Initiate a transfer — returns a transfer_id and OTP challenge."""
    if body.amount <= 0:
        _err("Amount must be positive")

    db = _db()
    try:
        from_acc = dict(db["accounts"].get(body.from_account))
        if from_acc["balance"] < body.amount:
            _err("Insufficient funds")
    except HTTPException:
        raise
    except Exception:
        _err(f"Account not found: {body.from_account}", 404)

    transfer_id = f"trf-{uuid.uuid4().hex[:8]}"
    db["pending_transfers"].upsert({
        "transfer_id": transfer_id,
        "from_account": body.from_account,
        "to_account": body.to_account,
        "amount": body.amount,
        "reference": body.reference,
        "status": "pending_otp",
        "created_at": datetime.now().isoformat(),
    }, pk="transfer_id")

    return _ok({
        "transfer_id": transfer_id,
        "otp_sent_to": "+1-555-***-3456",
        "expires_in_seconds": 300,
        "message": "OTP sent to registered mobile number.",
    })


class ConfirmTransferBody(BaseModel):
    otp: str


@app.post("/transfers/{transfer_id}/confirm")
def confirm_transfer(transfer_id: str, body: ConfirmTransferBody):
    """Confirm transfer with OTP (any 6-digit OTP accepted in dev mode)."""
    if len(body.otp) != 6 or not body.otp.isdigit():
        _err("OTP must be exactly 6 digits")

    db = _db()
    try:
        transfer = dict(db["pending_transfers"].get(transfer_id))
    except Exception:
        _err(f"Transfer not found: {transfer_id}", 404)

    if transfer["status"] != "pending_otp":
        _err("Transfer already processed or expired")

    # Apply debit/credit
    try:
        from_acc = dict(db["accounts"].get(transfer["from_account"]))
        from_acc["balance"] -= transfer["amount"]
        db["accounts"].upsert(from_acc, pk="account_id")
    except Exception:
        pass

    # Add transaction records
    now = datetime.now()
    db["transactions"].insert({
        "txn_id": f"txn-{uuid.uuid4().hex[:8]}",
        "account_id": transfer["from_account"],
        "amount": -transfer["amount"],
        "merchant": "Transfer Out",
        "category": "transfer",
        "date": now.strftime("%Y-%m-%d"),
        "reference": transfer.get("reference", transfer_id),
    })

    reference_no = f"TRF-{now.strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"
    transfer["status"] = "completed"
    transfer["reference_no"] = reference_no
    transfer["completed_at"] = now.isoformat()
    db["pending_transfers"].upsert(transfer, pk="transfer_id", alter=True)

    return _ok({
        "reference_no": reference_no,
        "amount": transfer["amount"],
        "status": "completed",
        "message": "Transfer completed successfully.",
    })


# ===========================================================================
# PHASE 5 — Discover / Products Endpoints
# ===========================================================================

@app.get("/products")
def list_products(type: str = "", category: str = ""):
    """List products — filter by type or category query param."""
    products = _load_products()
    filter_val = type or category
    if filter_val:
        products = [p for p in products if p.get("product_type") == filter_val or p.get("category") == filter_val]
    # Strip promotions from general product list unless explicitly requested
    if not filter_val:
        products = [p for p in products if p.get("product_type") != "promotion"]
    return _ok(products)


@app.get("/products/{product_id}")
def get_product(product_id: str):
    """Get full product detail by ID."""
    products = _load_products()
    product = next((p for p in products if p["id"] == product_id), None)
    if not product:
        _err(f"Product not found: {product_id}", 404)
    return _ok(product)


class CompareBody(BaseModel):
    ids: list[str]
    user_id: str = "user-demo-001"


@app.post("/products/compare")
def compare_products(body: CompareBody):
    """Side-by-side comparison for same-category products."""
    if len(body.ids) != 2:
        _err("Exactly 2 product IDs required for comparison")

    products = _load_products()
    items = [next((p for p in products if p["id"] == pid), None) for pid in body.ids]

    if None in items:
        missing = [pid for pid, item in zip(body.ids, items) if item is None]
        _err(f"Products not found: {missing}", 404)

    if items[0].get("category") != items[1].get("category"):
        _err("Can only compare products within the same category")

    agent_note = (
        f"Comparing {items[0]['name']} vs {items[1]['name']}. "
        "Both products have been evaluated based on your profile. "
        "The highlighted fields indicate the better value for your situation."
    )

    return _ok({
        "products": items,
        "agent_note": agent_note,
        "category": items[0].get("category"),
    })


@app.get("/promotions")
def list_promotions():
    """List all active promotions."""
    products = _load_products()
    promos = [p for p in products if p.get("product_type") == "promotion"]
    return _ok(promos)


class ActivatePromoBody(BaseModel):
    user_id: str = "user-demo-001"


@app.post("/promotions/{promo_id}/activate")
def activate_promotion(promo_id: str, body: ActivatePromoBody):
    """One-tap activate a promotion."""
    products = _load_products()
    promo = next((p for p in products if p["id"] == promo_id), None)
    if not promo:
        _err(f"Promotion not found: {promo_id}", 404)

    db = _db()
    db["activated_promos"].upsert({
        "promo_id": promo_id,
        "user_id": body.user_id,
        "activated_at": datetime.now().isoformat(),
        "status": "active",
        "expiry": promo.get("summary", {}).get("expiry", ""),
    }, pk=["promo_id", "user_id"])

    return _ok({
        "promo_id": promo_id,
        "name": promo["name"],
        "status": "activated",
        "message": f"'{promo['name']}' has been activated on your account.",
    })


# ===========================================================================
# PHASE 5 — Goals Endpoints
# ===========================================================================

@app.get("/goals/{user_id}")
def get_goals(user_id: str):
    from tools.goals.tracker import get_goals as _get_goals
    return _ok(_get_goals(user_id))


class CreateGoalBody(BaseModel):
    user_id: str
    name: str
    target_amount: float
    deadline: str = ""


@app.post("/goals")
def create_goal(body: CreateGoalBody):
    from tools.goals.tracker import create_goal as _create
    goal = _create(body.user_id, body.name, body.target_amount, body.deadline)
    return _ok(goal)


class UpdateGoalBody(BaseModel):
    target_amount: Optional[float] = None
    deadline: Optional[str] = None
    current_amount: Optional[float] = None
    name: Optional[str] = None


@app.patch("/goals/{goal_id}")
def update_goal(goal_id: str, body: UpdateGoalBody):
    from tools.goals.tracker import update_goal as _update
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    result = _update(goal_id, updates)
    if not result:
        _err(f"Goal not found: {goal_id}", 404)
    return _ok(result)


@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: str):
    from tools.goals.tracker import delete_goal as _delete
    ok = _delete(goal_id)
    if not ok:
        _err(f"Goal not found: {goal_id}", 404)
    return _ok({"goal_id": goal_id, "status": "cancelled"})


# ===========================================================================
# PHASE 6 — Execution Endpoints
# ===========================================================================

class StartExecutionBody(BaseModel):
    product_id: str
    product_type: str
    user_id: str = "user-demo-001"
    session_id: str = ""


@app.post("/execute/start")
def execute_start(body: StartExecutionBody):
    """Start an agent execution flow for a product."""
    try:
        from agents.execution.agent import PRODUCT_FLOWS, process_step
        from tools.execution.progress import save_progress
        from tools.user_profile.service import get_profile
    except ImportError as e:
        _err(f"Execution agent not yet implemented: {e}", 501)

    session_id = body.session_id or f"sess-{uuid.uuid4().hex[:8]}"
    flow = PRODUCT_FLOWS.get(body.product_type)
    if not flow:
        _err(f"Unknown product_type: {body.product_type}")

    try:
        profile_dict = get_profile(body.user_id)
        profile = profile_dict if isinstance(profile_dict, dict) else {}
    except Exception:
        profile = {}

    step_name = flow[0]
    result = process_step(step_name, body.product_type, profile, {})
    filled_data = {step_name: result.get("filled_value")} if result.get("status") == "done" else {}
    agent_log = [result.get("agent_log_entry", "")]

    save_progress(session_id, body.product_id, body.product_type, 0, filled_data, agent_log)

    return _ok({
        "session_id": session_id,
        **result,
        "step_index": 0,
        "total_steps": len(flow),
        "complete": False,
        "reference_no": None,
    })


class ResumeExecutionBody(BaseModel):
    session_id: str
    input_type: str = ""
    value: Any = None


@app.post("/execute/resume")
def execute_resume(body: ResumeExecutionBody):
    """Provide user input and advance the execution flow."""
    try:
        from agents.execution.agent import PRODUCT_FLOWS, process_step
        from tools.execution.progress import load_progress, save_progress
        from tools.execution.service import apply_product
        from tools.user_profile.service import get_profile
    except ImportError as e:
        _err(f"Execution agent not yet implemented: {e}", 501)

    progress = load_progress(body.session_id)
    if not progress:
        _err("Session not found or expired", 404)

    product_type = progress["product_type"]
    product_id = progress["product_id"]
    step_index = progress["step_index"]
    filled_data = json.loads(progress["filled_data"]) if isinstance(progress["filled_data"], str) else progress["filled_data"]
    agent_log = json.loads(progress["agent_log"]) if isinstance(progress["agent_log"], str) else progress["agent_log"]

    flow = PRODUCT_FLOWS.get(product_type, [])
    if not flow:
        _err(f"Unknown product_type: {product_type}")

    # Record user-provided value for current step
    current_step = flow[step_index]
    if body.value is not None:
        filled_data[current_step] = body.value
        agent_log.append(f"! User provided {current_step}: {body.value}")

    # Advance to next step
    next_index = step_index + 1
    if next_index >= len(flow):
        # All steps complete — create order
        reference_no = apply_product({
            "user_id": "user-demo-001",
            "product_id": product_id,
            "product_type": product_type,
            "agent_log": agent_log,
        })
        save_progress(body.session_id, product_id, product_type, next_index, filled_data, agent_log)
        return _ok({
            "session_id": body.session_id,
            "step": "complete",
            "status": "done",
            "step_index": next_index,
            "total_steps": len(flow),
            "complete": True,
            "reference_no": reference_no,
            "agent_log": agent_log,
            "input_type": None,
            "prompt": None,
            "options": None,
            "filled_value": None,
            "agent_log_entry": "Application submitted successfully.",
        })

    try:
        profile_dict = get_profile("user-demo-001")
        profile = profile_dict if isinstance(profile_dict, dict) else {}
    except Exception:
        profile = {}

    next_step = flow[next_index]
    result = process_step(next_step, product_type, profile, filled_data)

    if result.get("status") == "done":
        filled_data[next_step] = result.get("filled_value")
        agent_log.append(result.get("agent_log_entry", ""))

    save_progress(body.session_id, product_id, product_type, next_index, filled_data, agent_log)

    return _ok({
        "session_id": body.session_id,
        **result,
        "step_index": next_index,
        "total_steps": len(flow),
        "complete": False,
        "reference_no": None,
        "agent_log": agent_log,
    })


@app.get("/execute/progress/{session_id}")
def get_execution_progress(session_id: str):
    """Load saved partial progress for resume banner."""
    try:
        from tools.execution.progress import load_progress
    except ImportError as e:
        _err(f"Execution tools not yet implemented: {e}", 501)

    progress = load_progress(session_id)
    if not progress:
        _err("Session not found or expired", 404)
    return _ok(progress)


@app.delete("/execute/cancel/{session_id}")
def cancel_execution(session_id: str):
    """Cancel an execution session and mark it in the DB."""
    try:
        from tools.execution.progress import load_progress, save_progress
    except ImportError as e:
        _err(f"Execution tools not yet implemented: {e}", 501)

    progress = load_progress(session_id)
    if not progress:
        _err("Session not found", 404)

    db = _db()
    try:
        row = dict(db["agent_progress"].get(session_id))
        row["status"] = "cancelled"
        db["agent_progress"].upsert(row, pk="session_id")
    except Exception:
        pass

    return _ok({"session_id": session_id, "status": "cancelled"})


@app.get("/orders/{user_id}")
def get_orders(user_id: str):
    """List all submitted orders for a user."""
    db = _db()
    try:
        rows = list(db["orders"].rows_where("user_id = ?", [user_id], order_by="created_at DESC"))
        for row in rows:
            if isinstance(row.get("agent_log"), str):
                try:
                    row["agent_log"] = json.loads(row["agent_log"])
                except Exception:
                    pass
    except Exception:
        rows = []
    return _ok(rows)


@app.get("/agent-history/{user_id}")
def get_agent_history(user_id: str):
    """Completed agent actions with full agent_log."""
    db = _db()
    try:
        rows = list(db["orders"].rows_where(
            "user_id = ? AND status != ?", [user_id, "cancelled"],
            order_by="created_at DESC",
        ))
        for row in rows:
            if isinstance(row.get("agent_log"), str):
                try:
                    row["agent_log"] = json.loads(row["agent_log"])
                except Exception:
                    pass
    except Exception:
        rows = []
    return _ok(rows)
