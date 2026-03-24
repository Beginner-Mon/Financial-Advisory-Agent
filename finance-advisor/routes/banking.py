"""Banking routes — accounts, cards, transfers."""

from __future__ import annotations
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from config import get_logger
from routes import db, ok, err

logger = get_logger("routes.banking")
router = APIRouter(tags=["Banking"])


@router.get("/accounts/{user_id}")
def get_accounts(user_id: str):
    """List all accounts + balances for a user."""
    _db = db()
    try:
        rows = list(_db["accounts"].rows_where("user_id = ?", [user_id]))
    except Exception:
        rows = []
    return ok(rows)


@router.get("/accounts/{account_id}/txns")
def get_transactions(
    account_id: str,
    page: int = 1,
    limit: int = 20,
    category: str = "",
    search: str = "",
):
    """Paginated transaction history with optional filters."""
    _db = db()
    try:
        where = "account_id = ?"
        params: list = [account_id]
        if category:
            where += " AND category = ?"
            params.append(category)
        if search:
            where += " AND (merchant LIKE ? OR reference LIKE ?)"
            params += [f"%{search}%", f"%{search}%"]

        all_rows = list(_db["transactions"].rows_where(where, params, order_by="date DESC"))
        total = len(all_rows)
        start = (page - 1) * limit
        rows = all_rows[start : start + limit]
    except Exception:
        rows, total = [], 0

    return ok({"transactions": rows, "total": total, "page": page, "limit": limit})


@router.get("/cards/{user_id}")
def get_cards(user_id: str):
    """List all cards for a user."""
    _db = db()
    try:
        rows = list(_db["cards"].rows_where("user_id = ?", [user_id]))
    except Exception:
        rows = []
    return ok(rows)


class FreezeCardBody(BaseModel):
    freeze: bool


@router.patch("/cards/{card_id}/freeze")
def freeze_card(card_id: str, body: FreezeCardBody):
    """Freeze or unfreeze a card."""
    _db = db()
    try:
        card = dict(_db["cards"].get(card_id))
        card["status"] = "frozen" if body.freeze else "active"
        _db["cards"].upsert(card, pk="card_id")
        return ok(card)
    except Exception:
        err(f"Card not found: {card_id}", 404)


class TransferBody(BaseModel):
    from_account: str
    to_account: str
    amount: float = Field(gt=0, description="Transfer amount, must be positive")
    reference: str = ""
    user_id: str = ""


@router.post("/transfers")
def initiate_transfer(body: TransferBody):
    """Initiate a transfer — returns a transfer_id and OTP challenge."""
    _db = db()
    try:
        from_acc = dict(_db["accounts"].get(body.from_account))
        if from_acc["balance"] < body.amount:
            err("Insufficient funds")
    except HTTPException:
        raise
    except Exception:
        err(f"Account not found: {body.from_account}", 404)

    transfer_id = f"trf-{uuid.uuid4().hex[:8]}"
    _db["pending_transfers"].upsert({
        "transfer_id": transfer_id,
        "from_account": body.from_account,
        "to_account": body.to_account,
        "amount": body.amount,
        "reference": body.reference,
        "status": "pending_otp",
        "created_at": datetime.now().isoformat(),
    }, pk="transfer_id")

    return ok({
        "transfer_id": transfer_id,
        "otp_sent_to": "+1-555-***-3456",
        "expires_in_seconds": 300,
        "message": "OTP sent to registered mobile number.",
    })


class ConfirmTransferBody(BaseModel):
    otp: str


@router.post("/transfers/{transfer_id}/confirm")
def confirm_transfer(transfer_id: str, body: ConfirmTransferBody):
    """Confirm transfer with OTP (any 6-digit OTP accepted in dev mode)."""
    if len(body.otp) != 6 or not body.otp.isdigit():
        err("OTP must be exactly 6 digits")

    _db = db()
    try:
        transfer = dict(_db["pending_transfers"].get(transfer_id))
    except Exception:
        err(f"Transfer not found: {transfer_id}", 404)

    if transfer["status"] != "pending_otp":
        err("Transfer already processed or expired")

    try:
        from_acc = dict(_db["accounts"].get(transfer["from_account"]))
        from_acc["balance"] -= transfer["amount"]
        _db["accounts"].upsert(from_acc, pk="account_id")
    except Exception:
        pass

    now = datetime.now()
    _db["transactions"].insert({
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
    _db["pending_transfers"].upsert(transfer, pk="transfer_id", alter=True)

    return ok({
        "reference_no": reference_no,
        "amount": transfer["amount"],
        "status": "completed",
        "message": "Transfer completed successfully.",
    })
