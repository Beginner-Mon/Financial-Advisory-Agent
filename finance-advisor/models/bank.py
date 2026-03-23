"""
Bank data models — accounts, transactions, cards, agent execution, orders.
"""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
import json


class Account(BaseModel):
    account_id: str
    user_id: str
    type: str           # "checking" | "savings" | "loan" | "investment"
    balance: float
    currency: str = "USD"
    account_no: str     # masked for display (last 4 digits stored as e.g. "4521")
    status: str = "active"   # "active" | "frozen"


class Transaction(BaseModel):
    txn_id: str
    account_id: str
    amount: float       # negative = debit, positive = credit
    merchant: str
    category: str       # "food" | "income" | "subscription" | "transfer" | "shopping" | "utilities"
    date: str           # ISO date string
    reference: str = ""


class Card(BaseModel):
    card_id: str
    user_id: str
    type: str           # "credit" | "debit" | "prepaid"
    last_four: str
    status: str = "active"   # "active" | "frozen"
    spend_limit: float
    network: str        # "visa" | "mastercard"
    card_name: str = ""


class AgentProgress(BaseModel):
    session_id: str
    product_id: str
    product_type: str
    step_index: int
    filled_data: dict = Field(default_factory=dict)
    agent_log: list[str] = Field(default_factory=list)
    status: str = "in_progress"   # "in_progress" | "completed" | "expired" | "cancelled"
    expires_at: str = ""
    updated_at: str = ""


class Order(BaseModel):
    order_id: str
    user_id: str
    product_id: str
    product_type: str
    status: str = "submitted"   # "submitted" | "approved" | "rejected" | "cancelled"
    agent_log: list[str] = Field(default_factory=list)
    reference_no: str
    created_at: str


class Goal(BaseModel):
    goal_id: str
    user_id: str
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: str = ""           # ISO date string
    status: str = "active"       # "active" | "completed" | "cancelled"
    created_at: str = ""


class Payee(BaseModel):
    payee_id: str
    user_id: str
    name: str
    bank_name: str
    account_no: str              # masked last 4
    is_saved: bool = True
