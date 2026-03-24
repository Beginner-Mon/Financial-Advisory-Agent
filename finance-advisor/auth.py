"""
Authentication module — JWT-based auth for the Finance Advisor API.

Provides:
  - Password hashing (bcrypt)
  - JWT token creation & verification
  - FastAPI dependency `get_current_user` for protected endpoints
  - Demo user seeding for development
"""

from __future__ import annotations
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from config import settings, get_logger

logger = get_logger("auth")

# ---------------------------------------------------------------------------
# Lazy imports — only loaded when actually used
# ---------------------------------------------------------------------------
_jwt = None
_pwd_context = None


def _get_jwt():
    global _jwt
    if _jwt is None:
        try:
            from jose import jwt
            _jwt = jwt
        except ImportError:
            raise ImportError(
                "python-jose is required for auth. Install with: "
                "pip install python-jose[cryptography]"
            )
    return _jwt


def _get_bcrypt():
    try:
        import bcrypt
        return bcrypt
    except ImportError:
        raise ImportError(
            "bcrypt is required for auth. Install with: "
            "pip install bcrypt"
        )


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class TokenData(BaseModel):
    user_id: str
    email: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    bc = _get_bcrypt()
    pwd_bytes = password.encode("utf-8")
    salt = bc.gensalt()
    return bc.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    bc = _get_bcrypt()
    return bc.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(user_id: str, email: str = "") -> TokenResponse:
    """Create a JWT access token for the given user."""
    jwt = _get_jwt()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": uuid.uuid4().hex,
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def decode_token(token: str) -> TokenData:
    """Decode and validate a JWT token."""
    jwt = _get_jwt()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        return TokenData(user_id=user_id, email=payload.get("email"))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


# ---------------------------------------------------------------------------
# FastAPI Security Dependency
# ---------------------------------------------------------------------------

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> TokenData:
    """
    FastAPI dependency: extract and validate the user from the Bearer token.

    In development (when JWT_SECRET_KEY == 'dev-secret-change-in-production'),
    allows unauthenticated requests and falls back to a demo user.
    """
    is_dev = settings.JWT_SECRET_KEY == "dev-secret-change-in-production"

    if credentials is None or not credentials.credentials:
        if is_dev:
            return TokenData(user_id="user-demo-001", email="demo@example.com")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return decode_token(credentials.credentials)


async def get_current_user_id(
    user: TokenData = Depends(get_current_user),
) -> str:
    """Convenience dependency that returns just the user_id string."""
    return user.user_id
