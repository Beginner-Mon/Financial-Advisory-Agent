"""
Execution progress persistence — save and load agent flow state to SQLite.
"""
from __future__ import annotations
import json
import sqlite_utils
from datetime import datetime, timedelta

try:
    from config import settings
    _DEFAULT_DB = str(settings.DB_PATH)
except Exception:
    _DEFAULT_DB = "data/db.sqlite"

EXPIRY_HOURS = 48


def _db(db_path=None) -> sqlite_utils.Database:
    return sqlite_utils.Database(db_path or _DEFAULT_DB)


def save_progress(
    session_id: str,
    product_id: str,
    product_type: str,
    step_index: int,
    filled_data: dict,
    agent_log: list[str],
    db_path=None,
):
    """Upsert progress for a session."""
    db = _db(db_path)
    now = datetime.now()
    db["agent_progress"].upsert(
        {
            "session_id": session_id,
            "product_id": product_id,
            "product_type": product_type,
            "step_index": step_index,
            "filled_data": json.dumps(filled_data),
            "agent_log": json.dumps(agent_log),
            "status": "in_progress",
            "updated_at": now.isoformat(),
            "expires_at": (now + timedelta(hours=EXPIRY_HOURS)).isoformat(),
        },
        pk="session_id",
    )


def load_progress(session_id: str, db_path=None) -> dict | None:
    """Load progress. Returns None if session is expired, cancelled, or not found."""
    db = _db(db_path)
    try:
        row = dict(db["agent_progress"].get(session_id))
        # Check status
        if row.get("status") in ("completed", "cancelled", "expired"):
            return None
        # Check expiry
        expires_at = row.get("expires_at", "")
        if expires_at and expires_at < datetime.now().isoformat():
            # Mark as expired
            row["status"] = "expired"
            db["agent_progress"].upsert(row, pk="session_id")
            return None
        # Parse JSON fields
        if isinstance(row.get("filled_data"), str):
            try:
                row["filled_data"] = json.loads(row["filled_data"])
            except Exception:
                row["filled_data"] = {}
        if isinstance(row.get("agent_log"), str):
            try:
                row["agent_log"] = json.loads(row["agent_log"])
            except Exception:
                row["agent_log"] = []
        return row
    except Exception:
        return None
