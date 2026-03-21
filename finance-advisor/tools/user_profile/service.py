"""
User Profile Tool — SQLite-backed CRUD for user financial profiles.
Dependency-injects db_path for testability.
"""

import sqlite_utils
from pathlib import Path
from models.user import UserProfile
from config import settings, get_logger

logger = get_logger(__name__)


def _get_db(db_path: Path | str | None = None) -> sqlite_utils.Database:
    """Get a Database instance, using config default if no override."""
    path = settings.get_db_path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    return sqlite_utils.Database(str(path))


def save_profile(profile: UserProfile, db_path: Path | str | None = None) -> str:
    """Upsert a user profile to SQLite. Returns the user_id."""
    db = _get_db(db_path)
    data = profile.model_dump()
    # Convert enums to their string values for SQLite storage
    data["job_stability"] = data["job_stability"].value if hasattr(data["job_stability"], 'value') else data["job_stability"]
    data["risk_tolerance"] = data["risk_tolerance"].value if hasattr(data["risk_tolerance"], 'value') else data["risk_tolerance"]
    # Serialize complex fields
    import json
    data["goals"] = json.dumps(data["goals"])
    data["financial_holdings"] = json.dumps(data["financial_holdings"])
    db["profiles"].upsert(data, pk="user_id")
    logger.info(f"Saved profile for user_id={profile.user_id}")
    return profile.user_id


def get_profile(user_id: str, db_path: Path | str | None = None) -> UserProfile | None:
    """Retrieve a user profile from SQLite by user_id."""
    db = _get_db(db_path)
    try:
        row = db["profiles"].get(user_id)
        # Deserialize complex fields
        import json
        row["goals"] = json.loads(row["goals"])
        row["financial_holdings"] = json.loads(row["financial_holdings"])
        return UserProfile(**row)
    except Exception:
        logger.warning(f"Profile not found: user_id={user_id}")
        return None


def validate_and_enrich(raw: dict) -> UserProfile:
    """
    Fill missing optional fields with safe defaults,
    then validate and return a UserProfile.
    """
    raw.setdefault("risk_tolerance", "medium")
    raw.setdefault("job_stability", "stable")
    raw.setdefault("financial_holdings", {})
    raw.setdefault("goals", [])
    return UserProfile(**raw)
