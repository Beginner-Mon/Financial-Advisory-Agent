"""Quick endpoint verification for Phase 5-6."""
import urllib.request
import json

BASE = "http://localhost:8000"

def get(path):
    url = BASE + path
    try:
        r = urllib.request.urlopen(url, timeout=5)
        return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def post(path, body):
    url = BASE + path
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        r = urllib.request.urlopen(req, timeout=5)
        return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

results = []

def check(label, cond, detail=""):
    status = "PASS" if cond else "FAIL"
    results.append((status, label, detail))
    print(f"  [{status}] {label}" + (f"  -- {detail}" if detail else ""))

print("\n=== Phase 5-6 Endpoint Verification ===\n")

# Health
d = get("/health")
check("GET /health", d.get("status") in ("ok", "degraded"), str(d.get("status")))

# Accounts
d = get("/accounts/user-demo-001")
count = len(d.get("data", []))
check("GET /accounts/{user_id}", count >= 2, f"{count} accounts")

# Transactions
d = get("/accounts/acc-checking-001/txns")
txn_count = d.get("data", {}).get("total", 0)
check("GET /accounts/{id}/txns", txn_count >= 15, f"{txn_count} txns")

# Cards
d = get("/cards/user-demo-001")
card_count = len(d.get("data", []))
check("GET /cards/{user_id}", card_count >= 2, f"{card_count} cards")

# Products — cards
d = get("/products?type=cards")
prod_count = len(d.get("data", []))
check("GET /products?type=cards", prod_count >= 3, f"{prod_count} card products")

# Products — all
d = get("/products")
all_count = len(d.get("data", []))
check("GET /products (all)", all_count >= 12, f"{all_count} products")

# Product detail
d = get("/products/CC-001")
check("GET /products/CC-001", d.get("data", {}).get("id") == "CC-001", d.get("data", {}).get("name", ""))

# Promotions
d = get("/promotions")
promo_count = len(d.get("data", []))
check("GET /promotions", promo_count >= 3, f"{promo_count} promos")

# Goals
d = get("/goals/user-demo-001")
goal_count = len(d.get("data", []))
check("GET /goals/{user_id}", goal_count >= 1, f"{goal_count} goals")

# Orders (empty initially)
d = get("/orders/user-demo-001")
check("GET /orders/{user_id}", "data" in d, "ok")

# Agent history (empty initially)
d = get("/agent-history/user-demo-001")
check("GET /agent-history/{user_id}", "data" in d, "ok")

# Summary
passed = sum(1 for s, _, _ in results if s == "PASS")
failed = sum(1 for s, _, _ in results if s == "FAIL")
print(f"\n=== RESULTS: {passed} PASS / {failed} FAIL ===")
