"""Execution routes — AI agent product flows & traditional applications."""

from __future__ import annotations
import json
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import get_logger
from routes import db, ok, err, load_products

logger = get_logger("routes.execution")
router = APIRouter(tags=["Execution"])


# ---------------------------------------------------------------------------
# AI Agent Execution Flow
# ---------------------------------------------------------------------------

class StartExecutionBody(BaseModel):
    product_id: str
    product_type: str
    user_id: str = ""
    session_id: str = ""


@router.post("/execute/start")
def execute_start(body: StartExecutionBody):
    """Start an agent execution flow for a product."""
    try:
        from agents.execution.agent import PRODUCT_FLOWS, process_step
        from tools.execution.progress import save_progress
        from tools.user_profile.service import get_profile
    except ImportError as e:
        err(f"Execution agent not yet implemented: {e}", 501)

    session_id = body.session_id or f"sess-{uuid.uuid4().hex[:8]}"
    flow = PRODUCT_FLOWS.get(body.product_type)
    if not flow:
        err(f"Unknown product_type: {body.product_type}")

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

    return ok({
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


@router.post("/execute/resume")
def execute_resume(body: ResumeExecutionBody):
    """Provide user input and advance the execution flow."""
    try:
        from agents.execution.agent import PRODUCT_FLOWS, process_step
        from tools.execution.progress import load_progress, save_progress
        from tools.execution.service import apply_product
        from tools.user_profile.service import get_profile
    except ImportError as e:
        err(f"Execution agent not yet implemented: {e}", 501)

    progress = load_progress(body.session_id)
    if not progress:
        err("Session not found or expired", 404)

    product_type = progress["product_type"]
    product_id = progress["product_id"]
    step_index = progress["step_index"]
    filled_data = json.loads(progress["filled_data"]) if isinstance(progress["filled_data"], str) else progress["filled_data"]
    agent_log = json.loads(progress["agent_log"]) if isinstance(progress["agent_log"], str) else progress["agent_log"]

    flow = PRODUCT_FLOWS.get(product_type, [])
    if not flow:
        err(f"Unknown product_type: {product_type}")

    current_step = flow[step_index]
    if body.value is not None:
        filled_data[current_step] = body.value
        agent_log.append(f"! User provided {current_step}: {body.value}")

    next_index = step_index + 1
    if next_index >= len(flow):
        exec_user_id = progress.get("user_id", "user-demo-001")
        reference_no = apply_product({
            "user_id": exec_user_id,
            "session_id": body.session_id,
            "product_id": product_id,
            "product_type": product_type,
            "form_data": filled_data,
            "agent_log": agent_log,
        })
        save_progress(body.session_id, product_id, product_type, next_index, filled_data, agent_log)
        return ok({
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
        exec_user_id = progress.get("user_id", "user-demo-001")
        profile_dict = get_profile(exec_user_id)
        profile = profile_dict if isinstance(profile_dict, dict) else {}
    except Exception:
        profile = {}

    next_step = flow[next_index]
    result = process_step(next_step, product_type, profile, filled_data)

    if result.get("status") == "done":
        filled_data[next_step] = result.get("filled_value")
        agent_log.append(result.get("agent_log_entry", ""))

    save_progress(body.session_id, product_id, product_type, next_index, filled_data, agent_log)

    return ok({
        "session_id": body.session_id,
        **result,
        "step_index": next_index,
        "total_steps": len(flow),
        "complete": False,
        "reference_no": None,
        "agent_log": agent_log,
    })


@router.get("/execute/progress/{session_id}")
def get_execution_progress(session_id: str):
    """Load saved partial progress for resume banner."""
    try:
        from tools.execution.progress import load_progress
    except ImportError:
        err("Execution module not available", 501)

    progress = load_progress(session_id)
    if not progress:
        err("Session not found", 404)
    return ok(progress)


@router.delete("/execute/cancel/{session_id}")
def cancel_execution(session_id: str):
    """Cancel an in-progress execution session."""
    _db = db()
    try:
        _db["agent_progress"].delete(session_id)
        return ok({"session_id": session_id, "status": "cancelled"})
    except Exception:
        err(f"Session not found: {session_id}", 404)


@router.get("/orders/{user_id}")
def get_orders(user_id: str):
    """List all orders for a user."""
    _db = db()
    try:
        rows = list(_db["orders"].rows_where("user_id = ?", [user_id], order_by="created_at DESC"))
    except Exception:
        rows = []
    return ok(rows)


@router.get("/agent-history/{user_id}")
def get_agent_history(user_id: str):
    """Return AI agent interaction history for a user."""
    _db = db()
    try:
        orders = list(_db["orders"].rows_where(
            "user_id = ? AND source = ?", [user_id, "ai_agent"],
            order_by="created_at DESC",
        ))
    except Exception:
        orders = []
    return ok(orders)


# ---------------------------------------------------------------------------
# Traditional Application (No AI)
# ---------------------------------------------------------------------------

class TraditionalApplyRequest(BaseModel):
    product_id: str
    product_type: str
    form_data: dict
    session_id: str


@router.post("/traditional/apply")
def traditional_apply(req: TraditionalApplyRequest):
    """Process a manual step-by-step product application."""
    _db = db()

    _all_products = load_products()
    _prod_match = next((p for p in _all_products if p["id"] == req.product_id), None)
    product_name = _prod_match["name"] if _prod_match else req.product_type.capitalize()

    ref_prefix = {
        "card": "CC", "savings": "SAV", "loan": "LN",
        "insurance": "INS", "investment": "INV",
    }.get(req.product_type, "REF")
    ref_no = f"{ref_prefix}-{uuid.uuid4().hex[:8].upper()}"

    order = {
        "order_id": f"ord-{req.session_id}-{int(datetime.now().timestamp())}",
        "user_id": req.session_id,
        "product_id": req.product_id,
        "product_name": product_name,
        "product_type": req.product_type,
        "source": "traditional",
        "form_data": json.dumps(req.form_data),
        "status": "submitted",
        "reference_no": ref_no,
        "agent_log": json.dumps([]),
        "created_at": datetime.now().isoformat(),
    }

    if "orders" not in _db.table_names():
        _db["orders"].insert(order, pk="order_id")
    else:
        _db["orders"].insert(order)

    if req.product_type == "savings":
        nickname = req.form_data.get("account_nickname", f"Savings {ref_no}")
        deposit = float(req.form_data.get("initial_deposit", 0))
        acc_id = f"sav-{req.session_id}-{int(datetime.now().timestamp())}"
        products = load_products()
        prod_match = next((p for p in products if p["id"] == req.product_id), None)

        acc_row = {
            "account_id": acc_id,
            "user_id": req.session_id,
            "product_id": req.product_id,
            "product_name": prod_match["name"] if prod_match else "Savings",
            "nickname": nickname,
            "type": "savings",
            "account_no": f"SAV{uuid.uuid4().hex[:8].upper()}",
            "balance": deposit,
            "currency": "USD",
            "status": "active",
            "opened_via": "traditional",
            "opened_at": datetime.now().isoformat(),
        }
        _db["accounts"].insert(acc_row, pk="account_id")

        if deposit > 0:
            funding_acc = next(_db["accounts"].rows_where("user_id = ? AND type = 'checking' AND status = 'active'", [req.session_id]), None)
            if not funding_acc:
                funding_acc = next(_db["accounts"].rows_where("user_id = ? AND status = 'active' AND type != 'savings'", [req.session_id]), None)
            if not funding_acc:
                funding_acc = next(_db["accounts"].rows_where("user_id = ? AND account_id != ?", [req.session_id, acc_id]), None)

            if funding_acc:
                new_bal = float(funding_acc.get("balance", 0)) - deposit
                _db["accounts"].update(funding_acc["account_id"], {"balance": new_bal})

    messages = {
        "card": "Your credit card application has been submitted for review.",
        "savings": "Your savings account has been opened successfully!",
        "loan": "Your loan application is under review. You will receive a decision within 3 business days.",
        "insurance": "Your insurance policy has been purchased. Policy documents will be emailed.",
        "investment": "Your investment order has been placed.",
    }
    next_steps = {
        "card": "You will receive the card within 7-10 business days.",
        "savings": "You can view your new savings account in the Accounts tab.",
        "loan": "Keep your phone handy for a potential verification call.",
        "insurance": "Your first premium will be debited on the start date you selected.",
        "investment": "Units will be allocated within 2 business days.",
    }

    key_details = []
    detail_keys = {
        "card": ["full_name", "credit_limit", "statement_cycle", "autopay"],
        "savings": ["account_nickname", "initial_deposit", "funding_account"],
        "loan": ["loan_amount", "loan_tenure", "loan_purpose"],
        "insurance": ["coverage_tier", "coverage_amount", "payment_frequency"],
        "investment": ["investment_amount", "funding_account"],
    }
    for field in detail_keys.get(req.product_type, []):
        if field in req.form_data:
            key_details.append({
                "label": field.replace("_", " ").title(),
                "value": str(req.form_data[field]),
            })

    return ok({
        "order_id": order["order_id"],
        "reference_no": ref_no,
        "product_name": product_name,
        "product_type": req.product_type,
        "message": messages.get(req.product_type, "Application submitted."),
        "next_steps": next_steps.get(req.product_type, "We will be in touch."),
        "key_details": key_details,
    })
