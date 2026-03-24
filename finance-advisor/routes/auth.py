"""Auth routes — register & login."""

from __future__ import annotations
import uuid
from datetime import datetime

from fastapi import APIRouter
from config import get_logger
from auth import (
    RegisterRequest, LoginRequest,
    create_access_token, hash_password, verify_password,
)
from routes import db, ok, err

logger = get_logger("routes.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
def register(req: RegisterRequest):
    """Register a new user and return a JWT token."""
    _db = db()
    existing = list(_db["users"].rows_where("email = ?", [req.email]))
    if existing:
        err("Email already registered")

    user_id = f"user-{uuid.uuid4().hex[:8]}"
    _db["users"].insert({
        "user_id": user_id,
        "email": req.email,
        "password_hash": hash_password(req.password),
        "name": req.name,
        "created_at": datetime.now().isoformat(),
    }, pk="user_id")

    logger.info(f"New user registered: {user_id} ({req.email})")
    token = create_access_token(user_id, req.email)
    return ok({"access_token": token.access_token, "token_type": token.token_type, "expires_in": token.expires_in, "user_id": user_id})


@router.post("/login")
def login(req: LoginRequest):
    """Login with email + password, returns JWT token."""
    _db = db()
    rows = list(_db["users"].rows_where("email = ?", [req.email]))
    if not rows:
        err("Invalid email or password", 401)

    user = rows[0]
    if not verify_password(req.password, user["password_hash"]):
        err("Invalid email or password", 401)

    logger.info(f"User logged in: {user['user_id']}")
    token = create_access_token(user["user_id"], req.email)
    return ok({"access_token": token.access_token, "token_type": token.token_type, "expires_in": token.expires_in, "user_id": user["user_id"]})
