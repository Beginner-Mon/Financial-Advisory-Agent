"""
Product Catalog Tool — JSON-backed product filtering and matching.
Loads catalog once per path (cached), filters by risk level, goals, and credit score.
"""

import json
from pathlib import Path
from functools import lru_cache
from config import settings, get_logger

logger = get_logger(__name__)

# Risk profile → product risk level mapping
_RISK_MAP = {
    "conservative": "low",
    "moderate": "moderate",
    "aggressive": "high",
}


@lru_cache(maxsize=4)
def load_products(catalog_path: str | None = None) -> tuple[dict, ...]:
    """
    Load and cache the product catalog from JSON.
    Returns a tuple (for hashability with lru_cache).
    """
    path = settings.get_catalog_path(catalog_path)
    with open(path) as f:
        products = json.load(f)
    logger.info(f"Loaded {len(products)} products from {path}")
    return tuple(products)


def map_risk(risk_profile: str) -> str:
    """Map assessment risk profile to catalog risk level."""
    return _RISK_MAP.get(risk_profile, "moderate")


def get_recommendations(
    risk_profile: str,
    goals: list[str],
    credit_score: int = 700,
    catalog_path: str | None = None,
    max_results: int = 5,
) -> list[dict]:
    """
    Filter products by:
    1. Risk level matches the user's risk profile
    2. Credit score meets minimum requirement
    3. At least one goal overlaps with product's eligible goals

    Returns up to max_results products.
    """
    products = load_products(catalog_path)
    risk_level = map_risk(risk_profile)

    eligible = [
        p for p in products
        if p["risk_level"] == risk_level
        and p["min_credit"] <= credit_score
        and any(g in p["eligible_goals"] for g in goals)
    ]

    # Sort by return_pct descending (None → 0 for sorting)
    eligible.sort(key=lambda p: p.get("return_pct") or 0, reverse=True)

    results = eligible[:max_results]
    logger.info(
        f"Recommendations: risk={risk_profile}, goals={goals}, "
        f"credit={credit_score} → {len(results)} products"
    )
    return results
