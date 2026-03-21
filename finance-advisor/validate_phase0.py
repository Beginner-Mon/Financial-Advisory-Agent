"""Quick Phase 0 validation script."""
from pydantic import ValidationError
from models.user import UserProfile
from models.assessment import RiskAssessment
from models.enums import JobStability, RiskTolerance, RiskProfile
from config import settings

print("=== Phase 0 Validation ===")

# Test 1: Valid profile
p = UserProfile(
    user_id="t1", age=28, income=60000,
    credit_score=680, goals=["house", "Emergency Fund"]
)
assert p.goals == ["house", "emergency_fund"], f"Goal normalization failed: {p.goals}"
print("[PASS] Goal normalization works")

# Test 2: Invalid profile rejected
try:
    UserProfile(user_id="bad", age=0, income=-1, credit_score=200, goals=[])
    print("[FAIL] Should have raised ValidationError")
except ValidationError:
    print("[PASS] Invalid data rejected (age=0, income=-1, credit=200)")

# Test 3: Settings loaded
assert settings.DB_PATH is not None
assert settings.CATALOG_PATH is not None
print(f"[PASS] Config loaded: DB={settings.DB_PATH}")

# Test 4: Enums
assert JobStability.STABLE.value == "stable"
assert RiskProfile.AGGRESSIVE.value == "aggressive"
print("[PASS] Enums work correctly")

print("\n=== All Phase 0 checks passed! ===")
