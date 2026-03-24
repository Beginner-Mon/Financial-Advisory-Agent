"""
Centralized configuration for the Finance Advisor system.
All paths and settings are loaded from environment variables with sensible defaults.
"""

import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
_PROJECT_ROOT = Path(__file__).resolve().parent
load_dotenv(_PROJECT_ROOT / ".env")


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        self.PROJECT_ROOT = _PROJECT_ROOT
        self.DATA_DIR = _PROJECT_ROOT / "data"
        self.DB_PATH = Path(os.getenv("DB_PATH", str(self.DATA_DIR / "db.sqlite")))
        self.CATALOG_PATH = Path(os.getenv("CATALOG_PATH", str(self.DATA_DIR / "products.json")))

        # Google Gemini API
        self.GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
        self.GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

        # CORS — comma-separated allowed origins
        _origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081,http://localhost:8082,http://localhost:19006,http://localhost:8000")
        self.ALLOWED_ORIGINS: list[str] = [o.strip() for o in _origins.split(",") if o.strip()]

        # JWT Authentication
        self.JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
        self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

        # Rate limiting
        self.RATE_LIMIT_ADVISORY = os.getenv("RATE_LIMIT_ADVISORY", "30/minute")
        self.RATE_LIMIT_DATA = os.getenv("RATE_LIMIT_DATA", "60/minute")

        # Ensure data directory exists
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)


    def get_db_path(self, override: Path | str | None = None) -> Path:
        """Return DB path, allowing test overrides."""
        if override:
            return Path(override)
        return self.DB_PATH

    def get_catalog_path(self, override: Path | str | None = None) -> Path:
        """Return catalog path, allowing test overrides."""
        if override:
            return Path(override)
        return self.CATALOG_PATH


# Singleton settings instance
settings = Settings()


def get_logger(name: str) -> logging.Logger:
    """Create a configured logger for a given module."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter(
                "[%(asctime)s] %(levelname)-8s %(name)s — %(message)s",
                datefmt="%H:%M:%S",
            )
        )
        logger.addHandler(handler)
    logger.setLevel(getattr(logging, settings.LOG_LEVEL, logging.INFO))
    return logger
