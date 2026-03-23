"""
Seed script — populate SQLite with demo bank data for user-demo-001.

Run from finance-advisor/ directory:
    python tools/seed_db.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlite_utils
import uuid
from datetime import datetime, timedelta
from config import settings

DB_PATH = str(settings.DB_PATH)
DEMO_USER = "user-demo-001"


def seed_db():
    db = sqlite_utils.Database(DB_PATH)

    # -----------------------------------------------------------------------
    # Accounts
    # -----------------------------------------------------------------------
    accounts = [
        {
            "account_id": "acc-checking-001",
            "user_id": DEMO_USER,
            "type": "checking",
            "balance": 8200.00,
            "currency": "USD",
            "account_no": "4521",
            "status": "active",
        },
        {
            "account_id": "acc-savings-001",
            "user_id": DEMO_USER,
            "type": "savings",
            "balance": 16630.00,
            "currency": "USD",
            "account_no": "8834",
            "status": "active",
        },
    ]
    db["accounts"].upsert_all(accounts, pk="account_id")
    print(f"  [ok] Seeded {len(accounts)} accounts")

    # -----------------------------------------------------------------------
    # Transactions — 20 per account
    # -----------------------------------------------------------------------
    today = datetime.now()

    def txn(account_id, days_ago, amount, merchant, category, reference=""):
        return {
            "txn_id": f"txn-{uuid.uuid4().hex[:8]}",
            "account_id": account_id,
            "amount": amount,
            "merchant": merchant,
            "category": category,
            "date": (today - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            "reference": reference or f"REF-{uuid.uuid4().hex[:6].upper()}",
        }

    checking_txns = [
        txn("acc-checking-001", 0,  -6.50,    "Starbucks",          "food"),
        txn("acc-checking-001", 0,  -15.00,   "Netflix",            "subscription"),
        txn("acc-checking-001", 1,  4200.00,  "Payroll Direct",     "income",   "SALARY-MAR"),
        txn("acc-checking-001", 1,  -89.99,   "Amazon",             "shopping"),
        txn("acc-checking-001", 2,  -45.00,   "Spotify + Hulu",     "subscription"),
        txn("acc-checking-001", 3,  -120.00,  "Whole Foods",        "food"),
        txn("acc-checking-001", 4,  -500.00,  "Rent Transfer",      "transfer"),
        txn("acc-checking-001", 5,  -32.00,   "Shell Gas Station",  "transport"),
        txn("acc-checking-001", 6,  -18.50,   "Uber Eats",          "food"),
        txn("acc-checking-001", 7,  -250.00,  "AT&T Wireless",      "utilities"),
        txn("acc-checking-001", 8,  -9.99,    "Apple iCloud",       "subscription"),
        txn("acc-checking-001", 9,  -74.20,   "Target",             "shopping"),
        txn("acc-checking-001", 10, -55.00,   "Electricity Bill",   "utilities"),
        txn("acc-checking-001", 11, -12.50,   "Chipotle",           "food"),
        txn("acc-checking-001", 12, 150.00,   "Freelance Payment",  "income",   "FREELANCE-MAR"),
        txn("acc-checking-001", 13, -38.00,   "CVS Pharmacy",       "health"),
        txn("acc-checking-001", 14, -200.00,  "Gym Annual Fee",     "health"),
        txn("acc-checking-001", 20, -499.00,  "Best Buy",           "shopping"),
        txn("acc-checking-001", 25, 4200.00,  "Payroll Direct",     "income",   "SALARY-FEB"),
        txn("acc-checking-001", 28, -1200.00, "Rent Transfer",      "transfer"),
    ]

    savings_txns = [
        txn("acc-savings-001", 1,   500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 2,   62.50,   "Interest Credit",    "income",   "INT-FEB"),
        txn("acc-savings-001", 5,   500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 10, -1000.00, "Emergency Withdraw", "transfer"),
        txn("acc-savings-001", 15,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 20,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 25,  62.50,   "Interest Credit",    "income",   "INT-JAN"),
        txn("acc-savings-001", 30,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 35,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 40,  62.50,   "Interest Credit",    "income",   "INT-DEC"),
        txn("acc-savings-001", 45,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 50,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 55,  62.50,   "Interest Credit",    "income",   "INT-NOV"),
        txn("acc-savings-001", 60,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 65,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 70, -2000.00, "Vacation Fund",      "transfer"),
        txn("acc-savings-001", 75,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 80,  62.50,   "Interest Credit",    "income",   "INT-OCT"),
        txn("acc-savings-001", 85,  500.00,  "Auto Transfer In",   "transfer"),
        txn("acc-savings-001", 90,  1000.00, "Bonus Deposit",      "income",   "BONUS-Q3"),
    ]

    db["transactions"].upsert_all(checking_txns + savings_txns, pk="txn_id")
    print(f"  [ok] Seeded {len(checking_txns) + len(savings_txns)} transactions")

    # -----------------------------------------------------------------------
    # Cards
    # -----------------------------------------------------------------------
    cards = [
        {
            "card_id": "card-visa-001",
            "user_id": DEMO_USER,
            "type": "credit",
            "last_four": "4521",
            "status": "active",
            "spend_limit": 5000.00,
            "network": "visa",
            "card_name": "Visa Platinum",
        },
        {
            "card_id": "card-mc-001",
            "user_id": DEMO_USER,
            "type": "debit",
            "last_four": "8834",
            "status": "active",
            "spend_limit": 2000.00,
            "network": "mastercard",
            "card_name": "Mastercard Debit",
        },
    ]
    db["cards"].upsert_all(cards, pk="card_id")
    print(f"  [ok] Seeded {len(cards)} cards")

    # -----------------------------------------------------------------------
    # Goals (empty to start)
    # -----------------------------------------------------------------------
    db["goals"].upsert({
        "goal_id": "goal-001",
        "user_id": DEMO_USER,
        "name": "Emergency Fund",
        "target_amount": 25000.00,
        "current_amount": 16630.00,
        "deadline": (today + timedelta(days=180)).strftime("%Y-%m-%d"),
        "status": "active",
        "created_at": today.strftime("%Y-%m-%d"),
    }, pk="goal_id")
    print("  [ok] Seeded 1 goal")

    # -----------------------------------------------------------------------
    # User profile for demo user
    # -----------------------------------------------------------------------
    try:
        db["user_profiles"].upsert({
            "user_id": DEMO_USER,
            "name": "Alex Johnson",
            "email": "alex@example.com",
            "phone": "+1-555-012-3456",
            "age": 32,
            "income": 84000,
            "credit_score": 720,
            "job_stability": "stable",
            "risk_tolerance": "moderate",
            "goals": '["retirement","house","emergency_fund"]',
            "financial_holdings": "{}",
            "addresses": '[{"label":"home","street":"123 Main St","city":"San Francisco","state":"CA","zip":"94102"}]',
            "primary_address_index": 0,
        }, pk="user_id")
        print("  [ok] Seeded demo user profile")
    except Exception as e:
        print(f"  [warn] Could not upsert user profiles table: {e}")

    print(f"\n[DONE] Database seeded at: {DB_PATH}")
    print(f"   Demo user ID: {DEMO_USER}")


if __name__ == "__main__":
    print("Seeding demo database...")
    seed_db()
