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

    try:
        from tools.product_catalog.service import get_catalog
        products = get_catalog()
        prod_match = next((p for p in products if p["id"] == order_data.get("product_id")), None)
        prod_name = prod_match["name"] if prod_match else order_data.get("product_id")
    except Exception:
        prod_name = order_data.get("product_id")

    order = {
        "order_id": f"ord-{uuid.uuid4().hex[:8]}",
        "user_id": order_data.get("user_id", "user-demo-001"),
        "product_id": order_data.get("product_id", ""),
        "product_name": prod_name,
        "product_type": product_type,
        "status": "submitted",
        "source": "ai_agent",
        "form_data": json.dumps(order_data.get("form_data", {})),
        "agent_log": json.dumps(order_data.get("agent_log", [])),
        "reference_no": reference_no,
        "created_at": datetime.now().isoformat(),
    }
    
    if "orders" not in db.table_names():
        db["orders"].insert(order, pk="order_id")
    else:
        existing_cols = {col.name for col in db["orders"].columns}
        for col_name in ["form_data", "source", "reference_no", "product_name"]:
            if col_name not in existing_cols:
                db.execute(f'ALTER TABLE orders ADD COLUMN {col_name} TEXT DEFAULT ""')
        db["orders"].insert(order)

    # For savings — create a new account instance
    if product_type == "savings":
        form_data = order_data.get("form_data", {})
        nickname = form_data.get("account_nickname", f"Savings {reference_no}")
        deposit = float(form_data.get("initial_deposit", 0) or 0)
        session_id = order_data.get("session_id", "user-demo-001")
        acc_id = f"sav-{session_id}-{int(datetime.now().timestamp())}"
        
        # We need the product name
        try:
            from tools.product_catalog.service import get_catalog
            products = get_catalog()
            prod_match = next((p for p in products if p["id"] == order["product_id"]), None)
            prod_name = prod_match["name"] if prod_match else "Savings"
        except Exception:
            prod_name = "Savings"

        # Ensure accounts table has all needed columns
        if "accounts" in db.table_names():
            existing_cols = {col.name for col in db["accounts"].columns}
            for col_name in ["nickname", "product_id", "product_name", "opened_via", "opened_at"]:
                if col_name not in existing_cols:
                    db.execute(f'ALTER TABLE accounts ADD COLUMN {col_name} TEXT DEFAULT ""')

        acc_row = {
            "account_id": acc_id,
            "user_id": order["user_id"],
            "product_id": order["product_id"],
            "product_name": prod_name,
            "nickname": nickname,
            "type": "savings",
            "account_no": f"SAV{uuid.uuid4().hex[:8].upper()}",
            "balance": deposit,
            "currency": "USD",
            "status": "active",
            "opened_via": "ai_agent",
            "opened_at": datetime.now().isoformat(),
        }
        db["accounts"].insert(acc_row, pk="account_id")

        if deposit > 0:
            funding_acc = next(db["accounts"].rows_where("user_id = ? AND type = 'checking' AND status = 'active'", [order["user_id"]]), None)
            if not funding_acc:
                funding_acc = next(db["accounts"].rows_where("user_id = ? AND status = 'active' AND type != 'savings'", [order["user_id"]]), None)
            if not funding_acc:
                funding_acc = next(db["accounts"].rows_where("user_id = ? AND account_id != ?", [order["user_id"], acc_id]), None)
            
            if funding_acc:
                new_bal = float(funding_acc.get("balance", 0)) - deposit
                db["accounts"].update(funding_acc["account_id"], {"balance": new_bal})

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
