"""
Goals tracker — CRUD operations for user financial goals backed by SQLite.
"""
import sqlite_utils
import uuid
from datetime import datetime

try:
    from config import settings
    _DEFAULT_DB = str(settings.DB_PATH)
except Exception:
    _DEFAULT_DB = "data/db.sqlite"


def _db(db_path=None):
    return sqlite_utils.Database(db_path or _DEFAULT_DB)


def get_goals(user_id: str, db_path=None) -> list[dict]:
    """Return all active goals for a user."""
    db = _db(db_path)
    try:
        rows = list(db["goals"].rows_where(
            "user_id = ? AND status = ?", [user_id, "active"]
        ))
        return rows
    except Exception:
        return []


def create_goal(user_id: str, name: str, target_amount: float, deadline: str = "", db_path=None) -> dict:
    """Create a new goal and return it."""
    db = _db(db_path)
    goal = {
        "goal_id": f"goal-{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "name": name,
        "target_amount": target_amount,
        "current_amount": 0.0,
        "deadline": deadline,
        "status": "active",
        "created_at": datetime.now().strftime("%Y-%m-%d"),
    }
    db["goals"].upsert(goal, pk="goal_id")
    return goal


def update_goal(goal_id: str, updates: dict, db_path=None) -> dict | None:
    """Update goal fields (target_amount, deadline, current_amount)."""
    db = _db(db_path)
    try:
        existing = dict(db["goals"].get(goal_id))
        allowed = {"target_amount", "deadline", "current_amount", "name"}
        for k, v in updates.items():
            if k in allowed:
                existing[k] = v
        db["goals"].upsert(existing, pk="goal_id")
        return existing
    except Exception:
        return None


def delete_goal(goal_id: str, db_path=None) -> bool:
    """Soft-delete a goal by setting status to cancelled."""
    db = _db(db_path)
    try:
        existing = dict(db["goals"].get(goal_id))
        existing["status"] = "cancelled"
        db["goals"].upsert(existing, pk="goal_id")
        return True
    except Exception:
        return False
