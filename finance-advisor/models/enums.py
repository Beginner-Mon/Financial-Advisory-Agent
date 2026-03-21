"""Shared enumerations for constrained fields across models."""

from enum import Enum


class JobStability(str, Enum):
    STABLE = "stable"
    CONTRACT = "contract"
    SELF_EMPLOYED = "self-employed"


class RiskTolerance(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


class ProductType(str, Enum):
    SAVINGS = "savings"
    INVESTMENT = "investment"
    LOAN = "loan"
    INSURANCE = "insurance"


class ProductRiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
