"""Product recommendation data model."""

from pydantic import BaseModel, Field


class ProductRecommendation(BaseModel):
    """A single product recommendation with rationale."""

    product_id: str
    name: str
    type: str
    rationale: str = ""
    return_pct: float | None = None
