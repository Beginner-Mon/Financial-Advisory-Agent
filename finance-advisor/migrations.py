"""
Database migrations — initializes all tables with proper schemas on startup.

Call `run_migrations(db)` during app startup to ensure all tables exist
with the correct columns, eliminating runtime ALTER TABLE hacks.
"""

from __future__ import annotations
import sqlite_utils
from config import settings, get_logger

logger = get_logger("migrations")


def run_migrations(db: sqlite_utils.Database | None = None):
    """Create all tables if they don't exist. Safe to call repeatedly."""
    if db is None:
        db = sqlite_utils.Database(str(settings.DB_PATH))

    logger.info("Running database migrations...")

    # -----------------------------------------------------------------------
    # Users (authentication)
    # -----------------------------------------------------------------------
    if "users" not in db.table_names():
        db["users"].create({
            "user_id": str,
            "email": str,
            "password_hash": str,
            "name": str,
            "created_at": str,
        }, pk="user_id", if_not_exists=True)
        db["users"].create_index(["email"], unique=True, if_not_exists=True)
        logger.info("  Created table: users")

    # -----------------------------------------------------------------------
    # User profiles
    # -----------------------------------------------------------------------
    if "profiles" not in db.table_names():
        db["profiles"].create({
            "user_id": str,
            "age": int,
            "income": float,
            "credit_score": int,
            "job_stability": str,
            "risk_tolerance": str,
            "goals": str,  # JSON array
            "created_at": str,
            "updated_at": str,
        }, pk="user_id", if_not_exists=True)
        logger.info("  Created table: profiles")

    # -----------------------------------------------------------------------
    # Accounts
    # -----------------------------------------------------------------------
    if "accounts" not in db.table_names():
        db["accounts"].create({
            "account_id": str,
            "user_id": str,
            "product_id": str,
            "product_name": str,
            "nickname": str,
            "type": str,
            "account_no": str,
            "balance": float,
            "currency": str,
            "status": str,
            "opened_via": str,
            "opened_at": str,
        }, pk="account_id", if_not_exists=True)
        logger.info("  Created table: accounts")
    else:
        _ensure_columns(db, "accounts", {
            "nickname": str, "product_id": str, "product_name": str,
            "opened_via": str, "opened_at": str,
        })

    # -----------------------------------------------------------------------
    # Transactions
    # -----------------------------------------------------------------------
    if "transactions" not in db.table_names():
        db["transactions"].create({
            "txn_id": str,
            "account_id": str,
            "amount": float,
            "merchant": str,
            "category": str,
            "date": str,
            "reference": str,
        }, pk="txn_id", if_not_exists=True)
        logger.info("  Created table: transactions")

    # -----------------------------------------------------------------------
    # Cards
    # -----------------------------------------------------------------------
    if "cards" not in db.table_names():
        db["cards"].create({
            "card_id": str,
            "user_id": str,
            "type": str,
            "last_four": str,
            "status": str,
            "spend_limit": float,
            "network": str,
        }, pk="card_id", if_not_exists=True)
        logger.info("  Created table: cards")

    # -----------------------------------------------------------------------
    # Orders
    # -----------------------------------------------------------------------
    if "orders" not in db.table_names():
        db["orders"].create({
            "order_id": str,
            "user_id": str,
            "product_id": str,
            "product_name": str,
            "product_type": str,
            "source": str,
            "form_data": str,
            "status": str,
            "reference_no": str,
            "agent_log": str,
            "created_at": str,
        }, pk="order_id", if_not_exists=True)
        logger.info("  Created table: orders")
    else:
        _ensure_columns(db, "orders", {
            "form_data": str, "source": str, "reference_no": str, "product_name": str,
        })

    # -----------------------------------------------------------------------
    # Pending transfers
    # -----------------------------------------------------------------------
    if "pending_transfers" not in db.table_names():
        db["pending_transfers"].create({
            "transfer_id": str,
            "from_account": str,
            "to_account": str,
            "amount": float,
            "reference": str,
            "status": str,
            "created_at": str,
            "reference_no": str,
            "completed_at": str,
        }, pk="transfer_id", if_not_exists=True)
        logger.info("  Created table: pending_transfers")

    # -----------------------------------------------------------------------
    # Goals
    # -----------------------------------------------------------------------
    if "goals" not in db.table_names():
        db["goals"].create({
            "goal_id": str,
            "user_id": str,
            "name": str,
            "target_amount": float,
            "current_amount": float,
            "deadline": str,
            "created_at": str,
        }, pk="goal_id", if_not_exists=True)
        logger.info("  Created table: goals")

    # -----------------------------------------------------------------------
    # Agent progress (execution sessions)
    # -----------------------------------------------------------------------
    if "agent_progress" not in db.table_names():
        db["agent_progress"].create({
            "session_id": str,
            "product_id": str,
            "product_type": str,
            "step_index": int,
            "filled_data": str,
            "agent_log": str,
            "status": str,
            "expires_at": str,
        }, pk="session_id", if_not_exists=True)
        logger.info("  Created table: agent_progress")

    # -----------------------------------------------------------------------
    # Activated promotions
    # -----------------------------------------------------------------------
    if "activated_promos" not in db.table_names():
        db["activated_promos"].create({
            "promo_id": str,
            "user_id": str,
            "activated_at": str,
            "status": str,
            "expiry": str,
        }, pk=("promo_id", "user_id"), if_not_exists=True)
        logger.info("  Created table: activated_promos")

    # -----------------------------------------------------------------------
    # Profile collection sessions (for step-by-step profiling)
    # -----------------------------------------------------------------------
    if "profile_sessions" not in db.table_names():
        db["profile_sessions"].create({
            "session_id": str,
            "user_id": str,
            "collected_data": str,  # JSON
            "current_step": str,
            "is_complete": int,  # 0 or 1
            "created_at": str,
            "updated_at": str,
        }, pk="session_id", if_not_exists=True)
        logger.info("  Created table: profile_sessions")

    logger.info("Database migrations complete.")


def _ensure_columns(db: sqlite_utils.Database, table: str, columns: dict):
    """Add missing columns to an existing table."""
    existing = {col.name for col in db[table].columns}
    for col_name, col_type in columns.items():
        if col_name not in existing:
            default = "" if col_type == str else 0
            db.execute(f'ALTER TABLE {table} ADD COLUMN {col_name} TEXT DEFAULT "{default}"')
            logger.info(f"  Added column {table}.{col_name}")
