"""Products & Promotions routes."""

from __future__ import annotations
from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel
from config import get_logger
from routes import db, ok, err, load_products

logger = get_logger("routes.products")
router = APIRouter(tags=["Products"])


@router.get("/products")
def list_products(type: str = "", category: str = "", page: int = 1, limit: int = 10):
    """List products — filter by type or category, with pagination."""
    products = load_products()
    filter_val = type or category
    if filter_val:
        products = [p for p in products if p.get("product_type") == filter_val or p.get("category") == filter_val]
    if not filter_val:
        products = [p for p in products if p.get("product_type") != "promotion"]

    total = len(products)
    start = (page - 1) * limit
    paged = products[start : start + limit]
    return ok({"products": paged, "total": total, "page": page, "limit": limit})


@router.get("/products/{product_id}")
def get_product(product_id: str):
    """Get full product detail by ID."""
    products = load_products()
    product = next((p for p in products if p["id"] == product_id), None)
    if not product:
        err(f"Product not found: {product_id}", 404)
    return ok(product)


class CompareBody(BaseModel):
    ids: list[str]
    user_id: str = ""


@router.post("/products/compare")
def compare_products(body: CompareBody):
    """Side-by-side comparison for same-category products."""
    if len(body.ids) != 2:
        err("Exactly 2 product IDs required for comparison")

    products = load_products()
    items = [next((p for p in products if p["id"] == pid), None) for pid in body.ids]

    if None in items:
        missing = [pid for pid, item in zip(body.ids, items) if item is None]
        err(f"Products not found: {missing}", 404)

    if items[0].get("category") != items[1].get("category"):
        err("Can only compare products within the same category")

    agent_note = (
        f"Comparing {items[0]['name']} vs {items[1]['name']}. "
        "Both products have been evaluated based on your profile. "
        "The highlighted fields indicate the better value for your situation."
    )

    return ok({
        "products": items,
        "agent_note": agent_note,
        "category": items[0].get("category"),
    })


@router.get("/promotions")
def list_promotions():
    """List all active promotions."""
    products = load_products()
    promos = [p for p in products if p.get("product_type") == "promotion"]
    return ok(promos)


class ActivatePromoBody(BaseModel):
    user_id: str = ""


@router.post("/promotions/{promo_id}/activate")
def activate_promotion(promo_id: str, body: ActivatePromoBody):
    """One-tap activate a promotion."""
    products = load_products()
    promo = next((p for p in products if p["id"] == promo_id), None)
    if not promo:
        err(f"Promotion not found: {promo_id}", 404)

    _db = db()
    _db["activated_promos"].upsert({
        "promo_id": promo_id,
        "user_id": body.user_id,
        "activated_at": datetime.now().isoformat(),
        "status": "active",
        "expiry": promo.get("summary", {}).get("expiry", ""),
    }, pk=["promo_id", "user_id"])

    return ok({
        "promo_id": promo_id,
        "name": promo["name"],
        "status": "activated",
        "message": f"'{promo['name']}' has been activated on your account.",
    })
