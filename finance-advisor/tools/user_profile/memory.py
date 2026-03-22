"""
Conversation Memory — Persists message history to SQLite
for multi-turn advisory sessions.
"""

import json
from datetime import datetime
from pathlib import Path
import sqlite_utils
from config import settings, get_logger

logger = get_logger(__name__)


def _get_db(db_path: Path | str | None = None) -> sqlite_utils.Database:
    """Get a Database instance."""
    path = settings.get_db_path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    return sqlite_utils.Database(str(path))


def save_session(
    session_id: str,
    messages: list,
    db_path: Path | str | None = None,
) -> None:
    """Persist session messages to SQLite."""
    db = _get_db(db_path)
    db["sessions"].upsert(
        {
            "session_id": session_id,
            "messages": json.dumps(messages),
            "updated_at": datetime.now().isoformat(),
        },
        pk="session_id",
    )
    logger.debug(f"Saved session {session_id} ({len(messages)} messages)")


def load_session(
    session_id: str,
    db_path: Path | str | None = None,
) -> list:
    """Load session messages from SQLite."""
    db = _get_db(db_path)
    try:
        row = db["sessions"].get(session_id)
        messages = json.loads(row["messages"])
        logger.debug(f"Loaded session {session_id} ({len(messages)} messages)")
        return messages
    except Exception:
        logger.debug(f"No existing session: {session_id}")
        return []
