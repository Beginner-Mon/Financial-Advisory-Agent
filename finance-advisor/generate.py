import json
import random

def generate():
    path = r'd:\Swin documents\Swinhackathon\finance-advisor\data\products.json'
    with open(path, 'r', encoding='utf-8') as f:
        products = json.load(f)

    # Clean existing new ones if script was re-run
    products = [p for p in products if int(p['id'].split('-')[1]) <= 5]

    # --- CARDS ---
    card_names = ["Everyday Essentials", "Platinum Edge", "Velocity Rewards", "EcoGreen Cash", "Business Pro"]
    for i, name in enumerate(card_names, start=6):
        cid = f"CC-0{i:02d}"
        fee = random.choice([0, 50, 100, 250])
        cb = random.choice([1.0, 1.5, 2.5, 3.0, 5.0])
        products.append({
            "id": cid, "name": f"{name} Card", "product_type": "card", "category": "cards", "sub_type": "credit", "type": "savings",
            "min_credit": random.choice([600, 650, 700]), "risk_level": "low", "return_pct": None, "eligible_goals": ["rewards", "general"],
            "summary": {"annual_fee": fee, "cashback_pct": cb, "min_income": random.choice([20000, 40000, 60000]), "min_credit_score": 650, "network": random.choice(["visa", "mastercard"])},
            "detail": {"tagline": f"Enjoy up to {cb}% cashback.", "benefits": ["No foreign transaction fees", "Purchase protection"], "fees": {"late_payment": 35}, "faqs": [], "terms_summary": "Subject to approval."},
            "agent_flow": "card", "cta_label": "Apply for this card"
        })

    # --- SAVINGS ---
    sav_names = ["Goal Saver", "Yield Plus", "RetireSmart", "Flexi Deposit", "Online Max"]
    for i, name in enumerate(sav_names, start=6):
        sid = f"SAV-0{i:02d}"
        rate = round(random.uniform(2.5, 5.5), 2)
        products.append({
            "id": sid, "name": f"{name} Account", "product_type": "savings", "category": "savings", "sub_type": "regular", "type": "savings",
            "min_credit": 0, "risk_level": "low", "return_pct": rate, "eligible_goals": ["emergency_fund", "house", "general"],
            "summary": {"interest_rate": rate, "account_type": "regular", "min_balance": 100, "max_balance": None, "lock_in_months": 0},
            "detail": {"tagline": f"Earn competitive {rate}% p.a.", "rate_tiers": [], "early_withdrawal_fee": None, "deposit_insurance": True, "faqs": [], "terms_summary": "FDIC Insured."},
            "agent_flow": "savings", "cta_label": "Open this account"
        })

    # --- LOANS ---
    loan_names = ["Debt Consolidation", "Green Energy", "Renovation Plus", "Graduate Auto", "Medical Emergency"]
    for i, name in enumerate(loan_names, start=6):
        lid = f"LN-0{i:02d}"
        rate = round(random.uniform(4.0, 12.0), 2)
        products.append({
            "id": lid, "name": f"{name} Loan", "product_type": "loan", "category": "loans", "sub_type": "personal", "type": "loan",
            "min_credit": random.choice([600, 620, 650]), "risk_level": "moderate", "return_pct": None, "eligible_goals": ["general"],
            "summary": {"interest_rate_min": rate, "interest_rate_max": rate + 5.0, "loan_amount_min": 1000, "loan_amount_max": 50000, "tenure_min_months": 12, "tenure_max_months": 60, "min_income": 30000, "approval_days": "1-3 days"},
            "detail": {"tagline": "Flexible terms for your needs.", "required_docs": ["ID", "Payslips"], "faqs": [], "terms_summary": "Subject to assessment."},
            "agent_flow": "loan", "cta_label": "Get a quote"
        })

    # --- INSURANCE ---
    ins_names = ["Family Shield", "Auto Protect", "Home Guard", "Cyber Safe", "Senior Care"]
    for i, name in enumerate(ins_names, start=6):
        iid = f"INS-0{i:02d}"
        prem = random.randint(15, 120)
        products.append({
            "id": iid, "name": f"{name} Insurance", "product_type": "insurance", "category": "insurance", "sub_type": "life", "type": "insurance",
            "min_credit": 0, "risk_level": "low", "return_pct": None, "eligible_goals": ["health", "emergency_fund"],
            "summary": {"coverage_amount_min": 10000, "coverage_amount_max": 200000, "premium_monthly_est": prem, "term_years": 1, "underwriter": "Global Re"},
            "detail": {"tagline": "Comprehensive protection.", "coverage": ["Basic cover", "Accident cover"], "exclusions": ["Pre-existing"], "claim_process": [], "faqs": [], "terms_summary": "Renewable annually."},
            "agent_flow": "insurance", "cta_label": "Get a quote"
        })

    # --- INVESTMENTS ---
    inv_names = ["ESG Global Equities", "Emerging Markets Bond", "Real Estate Trust", "Blue Chip Income", "Tech Innovators"]
    for i, name in enumerate(inv_names, start=6):
        vid = f"INV-0{i:02d}"
        ret = round(random.uniform(4.0, 14.0), 2)
        products.append({
            "id": vid, "name": f"{name} Fund", "product_type": "investment", "category": "investments", "sub_type": "unit_trust", "type": "investment",
            "min_credit": 600, "risk_level": "high", "return_pct": ret, "eligible_goals": ["wealth", "retirement"],
            "summary": {"risk_rating": 4, "min_investment": 100, "platform_fee_pct": 0.5, "fund_manager": "Apex Funds", "historical_returns": {"1y": ret}},
            "detail": {"tagline": "Invest in future growth.", "fund_type": "Equity/Bond", "fund_factsheet_url": "#", "faqs": [], "terms_summary": "Capital at risk."},
            "agent_flow": "investment", "cta_label": "Invest now"
        })

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2)

if __name__ == '__main__':
    generate()
