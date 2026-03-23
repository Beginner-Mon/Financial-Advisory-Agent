"""
Execution service — create orders and manage execution lifecycle.
"""
from __future__ import annotations
import json
import uuid
import sqlite_utils
from datetime import datetime

try:
    from config import settings
    _DEFAULT_DB = str(settings.DB_PATH)
except Exception:
    _DEFAULT_DB = "data/db.sqlite"

_PREFIXES = {
    "card": "VPC",
    "savings": "SAV",
    "loan": "LN",
    "home_loan": "HLN",
    "insurance": "INS",
    "investment": "INV",
}


def _db(db_path=None) -> sqlite_utils.Database:
    return sqlite_utils.Database(db_path or _DEFAULT_DB)


def apply_product(order_data: dict, db_path=None) -> str:
    """
    Insert a completed order into the orders table.
    Returns the reference_no.
    """
    db = _db(db_path)
    product_type = order_data.get("product_type", "general")
    prefix = _PREFIXES.get(product_type, "ORD")
    year = datetime.now().strftime("%Y")
    reference_no = f"{prefix}-{year}-{uuid.uuid4().hex[:6].upper()}"

    order = {
        "order_id": f"ord-{uuid.uuid4().hex[:8]}",
        "user_id": order_data.get("user_id", "user-demo-001"),
        "product_id": order_data.get("product_id", ""),
        "product_type": product_type,
        "status": "submitted",
        "agent_log": json.dumps(order_data.get("agent_log", [])),
        "reference_no": reference_no,
        "created_at": datetime.now().isoformat(),
    }
    db["orders"].insert(order)

    # Mark agent_progress as completed
    session_id = order_data.get("session_id")
    if session_id:
        try:
            row = dict(db["agent_progress"].get(session_id))
            row["status"] = "completed"
            db["agent_progress"].upsert(row, pk="session_id")
        except Exception:
            pass

    return reference_no


def cancel_order(session_id: str, db_path=None) -> bool:
    """Mark a pending order / session as cancelled."""
    db = _db(db_path)
    try:
        row = dict(db["agent_progress"].get(session_id))
        row["status"] = "cancelled"
        db["agent_progress"].upsert(row, pk="session_id")
        return True
    except Exception:
        return False
