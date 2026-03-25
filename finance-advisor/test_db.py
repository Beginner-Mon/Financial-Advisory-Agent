import sqlite_utils

db = sqlite_utils.Database("data/db.sqlite")

# Print all accounts
print("--- ALL ACCOUNTS ---")
for r in db["accounts"].rows:
    print(r["account_id"], r["user_id"], r["type"], r["status"], r["balance"])

print("\n--- TEST QUERY ---")
funding_acc = next(db["accounts"].rows_where("user_id = ? AND type = 'checking' AND status = 'active'", ["user-demo-001"]), None)
print("Checking Account found:", funding_acc)
