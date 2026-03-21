"""Risk assessment data model."""

from pydantic import BaseModel, Field
from models.enums import RiskProfile


class RiskAssessment(BaseModel):
    """Output of the financial intelligence engine."""

    health_score: float = Field(
        ..., ge=0, le=100, description="Financial health score (0–100)"
    )
    risk_profile: RiskProfile
    liquidity_ratio: float = Field(..., ge=0)
    debt_ratio: float = Field(..., ge=0, le=1.0)
    plan_steps: list[str] = Field(default_factory=list)
