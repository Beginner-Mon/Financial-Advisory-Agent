"""User profile data model."""

from pydantic import BaseModel, Field, field_validator
from models.enums import JobStability, RiskTolerance


class UserProfile(BaseModel):
    """Canonical user profile flowing between agents and tools."""

    user_id: str
    age: int = Field(..., gt=0, le=120, description="User's age in years")
    income: float = Field(..., ge=0, description="Annual income in USD")
    credit_score: int = Field(
        ..., ge=300, le=850, description="Credit score (300–850)"
    )
    job_stability: JobStability = JobStability.STABLE
    risk_tolerance: RiskTolerance = RiskTolerance.MEDIUM
    goals: list[str] = Field(default_factory=list)
    financial_holdings: dict = Field(default_factory=dict)

    @field_validator("goals", mode="before")
    @classmethod
    def normalize_goals(cls, v):
        """Normalize goal strings to lowercase with underscores."""
        if isinstance(v, list):
            return [g.strip().lower().replace(" ", "_") for g in v if g.strip()]
        return v
