"""
Shared helpers for all API routes.
Provides DB access, standard response formatters, and product catalog loading.
"""

from __future__ import annotations
import json
from typing import Any

import sqlite_utils
from fastapi import HTTPException
from config import settings


def db() -> sqlite_utils.Database:
    """Get a database connection."""
    return sqlite_utils.Database(str(settings.DB_PATH))


def ok(data: Any) -> dict:
    """Standard success response wrapper."""
    return {"success": True, "data": data, "error": None}


def err(msg: str, status: int = 400):
    """Raise an HTTP error with standard error response."""
    raise HTTPException(status_code=status, detail={"success": False, "data": None, "error": msg})


def load_products() -> list[dict]:
    """Load the product catalog from JSON file."""
    with open(str(settings.CATALOG_PATH), "r", encoding="utf-8") as f:
        return json.load(f)
