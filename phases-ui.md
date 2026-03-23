# Financial Advisory Bank App — UI & Agent Execution Plan

> **Full bank app.** AI advisory lives in the Discover tab — one feature inside a complete banking experience covering accounts, transfers, cards, and product execution via autonomous agent.

---

## Table of Contents

- [App Philosophy & Overview](#app-philosophy--overview)
- [Screen Architecture — Full Map](#screen-architecture--full-map)
- [Core Bank Screens](#core-bank-screens)
- [Discover Tab — AI Advisory & Product Browse](#discover-tab--ai-advisory--product-browse)
- [Agent Execution Model](#agent-execution-model)
- [Product Action Types — Per Category](#product-action-types--per-category)
- [Backend Additions & API Endpoints](#backend-additions--api-endpoints)
- [Build Order & Folder Structure](#build-order--folder-structure)

---

## App Philosophy & Overview

### Core principle

The AI advisor is a **tenant inside a bank app, not the landlord.** It lives in the Discover tab alongside a freely-browsable product catalogue. Users who don't want AI recommendations can still browse every product category manually — the advisor surfaces personalised picks at the top.

### What the app covers

| Layer | What it does |
|---|---|
| Primary app | Full bank app — accounts, transfers, cards, transactions |
| AI Advisor | One tab ("Discover") — recommends products, executes on user's behalf |
| Agent role | Fills forms, navigates flows, pauses for OTP/biometric, delivers summary |
| Execution UI | Minimal spinner while agent works — summary card when done |
| Navigation | Bottom tab bar: Home · Accounts · Transfer · Discover · Profile |

### Bottom navigation

```
┌────────┬──────────┬──────────┬──────────┬─────────┐
│  Home  │ Accounts │ Transfer │ Discover │ Profile │
└────────┴──────────┴──────────┴──────────┴─────────┘
```

### Product categories in Discover tab

| Category | Products |
|---|---|
| Cards | Credit cards, debit cards, prepaid cards |
| Savings | High-yield savings, fixed deposit, children savings |
| Loans | Personal loan, home loan, car loan |
| Insurance | Life insurance, travel insurance, health plans |
| Investments | Unit trusts, fixed income, robo-advisor |
| Promotions | Cashback offers, partner deals, fee waivers |

### Agent execution model (all product types)

```
1. User taps CTA          → "Apply for this card", "Open this account", "Invest now"
2. Agent takes over       → spinner shown, agent fills all fields from profile silently
   !  Pause point         → agent stops, asks user for OTP / biometric / missing info
3. Agent resumes          → continues with user-provided data, completes remaining steps
4. Summary card           → lists every step, what was filled, reference number, next steps
```

---

## Screen Architecture — Full Map

### Home tab

| Screen | Content |
|---|---|
| Home dashboard | Balance summary, recent transactions, quick actions, AI nudge banner |
| Notifications | Transaction alerts, offer alerts, agent completion notices |

### Accounts tab

| Screen | Content |
|---|---|
| Accounts list | All accounts: checking, savings, cards, loans — with balances |
| Account detail | Single account: balance, recent transactions, account number, actions |
| Transaction history | Filterable full list with search, date range, category |
| Transaction detail | Single transaction: amount, merchant, category, reference |
| Cards management | View cards, freeze/unfreeze, set limits, view PIN |

### Transfer tab

| Screen | Content |
|---|---|
| Transfer home | Quick transfer, saved payees, scheduled payments |
| New transfer | Enter recipient, amount, reference — OTP confirmation |
| Pay bills | Utility, telco, government — biller search + amount |
| Transfer confirm | Review screen before OTP → success screen |

### Discover tab (AI advisory)

| Screen | Content |
|---|---|
| Discover home | AI health score, recommended products strip, category browse, promotions |
| Category listing | All products in one category (e.g. all cards), filterable |
| Product detail | Per-type layout — card ≠ loan ≠ savings ≠ insurance |
| Compare | Side-by-side, same category only |
| Agent execution | Spinner → pause point(s) → resume → summary card |
| Promotions detail | Offer terms, eligibility, one-tap activate |
| AI chat | Ask anything about products or financial health |

### Profile tab

| Screen | Content |
|---|---|
| Profile home | Personal info, security settings, preferences |
| Active products | Cards, loans, savings, insurance currently held |
| Goals tracker | Savings goals, progress, AI suggestions to reach them faster |
| Agent history | Log of all agent-executed actions with summaries and status |
| Settings | Notifications, biometric, language, security |

---

## Core Bank Screens

### Home Dashboard

The primary landing screen. Shows total net position, quick action shortcuts, recent transactions, and a subtle AI nudge card if the advisor has a recommendation.

```
┌─────────────────────────────┐
│ NavBar: "Good morning, Alex"│  ← date + notification bell
├─────────────────────────────┤
│ Total balance               │
│ $24,830.00                  │  ← large, navy, primary number
│ ↑ $1,240 this month         │  ← trend indicator
├─────────────────────────────┤
│ [Checking]  [Savings]  [+]  │  ← account pill strip, scrollable
│  $8,200      $16,630        │
├─────────────────────────────┤
│ Quick actions               │
│ [Transfer] [Pay] [Top-up]   │  ← icon + label grid (configurable)
│ [Cards]    [More]           │
├─────────────────────────────┤
│ AI Advisor nudge (if any)   │
│ "You qualify for a 4.5%     │
│  savings rate. See offer →" │  ← dismissible banner, navy bg
├─────────────────────────────┤
│ Recent transactions         │
│ Starbucks       -$6.50      │
│ Salary          +$4,200.00  │
│ Netflix         -$15.00     │
│               View all →    │
└─────────────────────────────┘
```

**Design notes:**
- Total balance aggregates all accounts held by the user
- AI nudge banner is dismissible and only appears when advisor has ≥1 recommendation
- Quick actions are configurable in Settings (user can reorder)
- Tapping any account pill navigates to Account Detail screen
- Resume banner appears here if user has an in-progress agent execution (see Agent Execution Model)

---

### Accounts & Transaction History

Account detail shows balance, masked account number, and a full scrollable transaction list. Transaction detail appears as a bottom sheet.

```
Account detail:
┌─────────────────────────────┐
│ ← Checking Account          │
│ •••• 4521                   │  ← masked account number
│ $8,200.00 available         │  ← large balance
│ [Freeze card] [Statements]  │
├─────────────────────────────┤
│ [All] [In] [Out] [Search]   │  ← filter pills
│ ─── Today ──────────────── │
│ Starbucks         -$6.50    │
│ ─── Yesterday ──────────── │
│ Salary          +$4,200.00  │
│ Netflix           -$15.00   │
│ Amazon            -$89.99   │
└─────────────────────────────┘

Transaction detail (bottom sheet on tap):
• Merchant name, logo placeholder
• Amount, date, time
• Category tag (Food / Income / Subscription)
• Reference number
```

---

### Cards Management

Manage existing physical and virtual cards. New cards are applied via the Discover tab — this screen only manages cards already held.

```
┌─────────────────────────────┐
│ My Cards                    │
├─────────────────────────────┤
│ ╔═══════════════════╗       │
│ ║ VISA Platinum     ║       │  ← card visual (navy/gold palette)
│ ║ •••• •••• •••• 4521║      │
│ ║ Alex Johnson      ║       │
│ ╚═══════════════════╝       │
│ [◀]  1 of 2  [▶]            │  ← swipe between cards
├─────────────────────────────┤
│ Card status    Active  [🔒] │  ← freeze toggle
│ Monthly limit  $5,000       │  ← tap to change
│ Online txns    Enabled      │  ← toggle
│ Contactless    Enabled      │  ← toggle
├─────────────────────────────┤
│ [View PIN]  [Report lost]   │
│ [Request replacement]       │
└─────────────────────────────┘
```

**Design notes:**
- Freeze toggle sends `PATCH /cards/{id}/freeze`
- View PIN requires biometric confirmation before revealing
- Card visual uses navy/gold palette matching institutional design language

---

### Transfer & Payments

Standard 4-step bank transfer flow. Transfers are **always manual** — the agent never initiates a transfer autonomously for security reasons.

```
Step 1 — Recipient
  • Saved payees list (search)
  • + New payee (bank + account number)

Step 2 — Amount & details
  • Amount input (large keypad)
  • From account selector
  • Reference / note (optional)

Step 3 — Review
  ┌───────────────────────────┐
  │ To:      John Smith       │
  │ Bank:    DBS Bank         │
  │ Account: •••• 8821        │
  │ Amount:  $500.00          │
  │ Ref:     Rent June        │
  │          [Confirm →]      │
  └───────────────────────────┘

Step 4 — OTP input
  • 6-digit OTP field
  • Resend timer (60s)
  • On success → success screen with reference number
```

**Design notes:**
- OTP step is always required regardless of biometric settings (bank security rule)
- Success screen shows reference number and option to save payee
- Transfer is the one flow the agent is explicitly excluded from

---

## Discover Tab — AI Advisory & Product Browse

### Discover Home Screen

Entry point to the AI advisory and product catalogue. AI-curated picks sit at the top; the full product category browser is always available to all users regardless of AI state.

```
┌─────────────────────────────┐
│ Discover                    │
├─────────────────────────────┤
│ Your financial health       │
│ ●●●●●●●○○○  74/100 Moderate │  ← score strip, tap for detail
├─────────────────────────────┤
│ Recommended for you         │
│ ┌──────┐ ┌──────┐ ┌──────┐  │
│ │Visa  │ │4.5%  │ │Home  │  │  ← horizontal scroll, AI picks
│ │Plat. │ │Sav.  │ │Loan  │  │
│ └──────┘ └──────┘ └──────┘  │
├─────────────────────────────┤
│ Browse products             │
│ [Cards]  [Savings] [Loans]  │  ← 2×3 category grid
│ [Insur.] [Invest.] [Promos] │
├─────────────────────────────┤
│ Current promotions          │
│ 3% cashback on dining →     │
│ Fee waiver until Dec 31 →   │
├─────────────────────────────┤
│ [  Ask the AI advisor  ] ↑  │  ← persistent chat bar
└─────────────────────────────┘
```

---

### Product Detail — Per-Type Layouts

Each product category renders a **different detail layout template**. They share a common shell but the body, fields, and CTA label differ entirely per type.

#### Shared shell (all product types)

```
← Back   [Product name]
─────────── body ────────────
[Ask about this product ↑]
[sticky bottom CTA button]
```

#### Cards layout

```
Body:
• Card visual (animated, navy/gold)
• Annual fee | Rewards rate | Min credit limit
• Key benefits list (cashback %, lounge access, insurance)
• Eligibility: min income, min age, credit score
• Fees table (annual, late payment, forex, cash advance)

CTA: "Apply for this card"
```

#### Savings layout

```
Body:
• Interest rate (large, prominent)
• Account type badge (regular / fixed deposit / flexi)
• Rate tiers table (e.g. $0–$50k: 2.0%, $50k+: 4.5%)
• Lock-in period, min/max balance
• FDIC / deposit insurance badge
• Early withdrawal fee (if applicable)

CTA: "Open this account"
```

#### Loans layout

```
Body:
• Loan type badge (personal / home / car)
• Interest rate range (p.a.)
• Loan calculator widget (amount slider + tenure → monthly repayment)
• Required documents checklist
• Eligibility criteria (income, age, employment type)
• Approval timeline

CTA: "Get a quote" (personal) / "Apply now" (home / car)
```

#### Insurance layout

```
Body:
• Coverage summary (what's covered / not covered)
• Premium estimate (monthly / annual toggle)
• Key exclusions accordion
• Claim process summary (3–4 steps)
• Underwriter / provider badge

CTA: "Get a quote" → "Purchase plan" (after quote accepted)
```

#### Investments layout

```
Body:
• Fund type, risk rating (1–7 scale, visual indicator)
• Historical returns chart (1y / 3y / 5y tabs)
• Min investment amount, platform fee (% p.a.)
• Fund manager info
• Fund factsheet download link

CTA: "Invest now"
```

#### Promotions layout

```
Body:
• Offer headline + expiry date badge
• Eligibility check result (instant, uses stored profile)
• Terms & conditions accordion
• How to activate (numbered steps)
• Linked products (which cards/accounts qualify)

CTA: "Activate offer"   ← one-tap, no agent flow needed
```

**Implementation note:** `product_type` field in `products.json` drives which layout template the frontend renders AND which agent flow step list is used.

---

### Category Listing & Compare

```
Category listing (e.g. Cards):
┌─────────────────────────────┐
│ ← Credit cards              │
│ [All] [Cashback] [Travel]   │  ← sub-type filter pills
│                  [Compare]  │  ← toggle (max 2 items)
├─────────────────────────────┤
│ ★ AI Pick                   │  ← badge on recommended items
│ Visa Platinum               │
│ 3% cashback · $180/yr fee   │
│ [View details]  [Apply]     │
├─────────────────────────────┤
│ Mastercard Gold             │
│ 2% cashback · $90/yr fee    │
│ [View details]  [Apply]     │
└─────────────────────────────┘

Compare screen (same category only):
┌──────────────┬──────────────┐
│ Visa Plat.   │ MC Gold      │
├──────────────┼──────────────┤
│ 3% cashback  │ 2% cashback  │  ← green = better
│ $180/yr fee  │ $90/yr fee   │
│ $50k min inc │ $30k min inc │
│ Lounge  Yes  │ Lounge  No   │
├──────────────┼──────────────┤
│   [Apply]    │   [Apply]    │
└──────────────┴──────────────┘
Agent note: "Visa Platinum gives more cashback but
costs more annually. Based on your $120k income,
either product qualifies."
```

**Design notes:**
- Compare is only enabled within the same category — UI disables cross-category selection
- Agent note generated by follow-up agent using user profile as context
- "AI Pick" badge shown on items matching the user's risk/goal profile from the advisor

---

## Agent Execution Model

### Execution Screen — Three States

When the user taps a product CTA, a full-screen execution view takes over. It has three states: working, paused, and done.

#### State 1 — Agent working (spinner)

```
┌─────────────────────────────┐
│                             │
│                             │
│          ○ ● ○              │  ← subtle 3-dot pulse animation
│                             │
│   Agent is completing       │
│   your application...       │
│                             │
│         [Cancel]            │  ← always visible, saves progress
└─────────────────────────────┘
```

#### State 2a — Pause point: OTP

```
┌─────────────────────────────┐
│ One moment needed           │
│ ─────────────────────────── │
│ We need your OTP to confirm │
│ your identity.              │
│                             │
│ Sent to +60 12-345 6789     │
│ [_ _ _ _ _ _]               │  ← 6-digit OTP input
│ Resend in 45s               │
│              [Continue →]   │
└─────────────────────────────┘
```

#### State 2b — Pause point: biometric

```
┌─────────────────────────────┐
│ Confirm your identity       │
│                             │
│      [Fingerprint icon]     │  ← native biometric prompt
│                             │
│  Touch sensor to continue   │
│      [Use PIN instead]      │
└─────────────────────────────┘
```

#### State 2c — Pause point: user clarification

```
┌─────────────────────────────┐
│ Quick question              │
│ ─────────────────────────── │
│ Which address should we     │
│ deliver your card to?       │
│                             │
│ ● 123 Main St (on file)     │  ← options from profile
│ ○ Enter a new address       │
│              [Continue →]   │
└─────────────────────────────┘
```

#### State 3 — Summary card (done)

```
┌─────────────────────────────┐
│ ✓ Application submitted     │  ← animated checkmark
│ Visa Platinum Card          │
│ Ref: VPC-2024-038821        │
│ ─────────────────────────── │
│ What the agent did          │
│ ✓ Filled personal details   │
│   from your profile         │
│ ✓ Selected $5,000 limit     │
│ ✓ Chose delivery: 123 Main  │
│ ✓ Agreed to terms           │
│ ! You selected card design  │  ← user actions marked with !
│ ! You confirmed with OTP    │
│ ─────────────────────────── │
│ What happens next           │
│ Approval: 3–5 working days  │
│ Card delivery: 7–10 days    │
│ ─────────────────────────── │
│ [View in My Products]       │
│ [Back to Discover]          │
└─────────────────────────────┘
```

**Design notes:**
- Agent actions shown with ✓, user-provided inputs shown with ! — user sees exactly what was done on their behalf
- Summary saved to Agent History in Profile tab
- Reference number stored in SQLite `orders` table

---

### Partial Progress & Resume

If the user cancels mid-flow or the app closes, the agent's progress is persisted. On next open, a resume banner appears on the Home screen and Discover tab.

```python
# tools/execution/progress.py
import sqlite_utils, json
from datetime import datetime

DB_PATH = "data/db.sqlite"

def save_progress(session_id, product_id, product_type, step_index, filled_data, agent_log):
    db = sqlite_utils.Database(DB_PATH)
    db["agent_progress"].upsert({
        "session_id":   session_id,
        "product_id":   product_id,
        "product_type": product_type,
        "step_index":   step_index,              # which step we paused at
        "filled_data":  json.dumps(filled_data), # what was already filled
        "agent_log":    json.dumps(agent_log),   # steps completed so far
        "status":       "in_progress",
        "updated_at":   datetime.now().isoformat(),
        "expires_at":   (datetime.now() + timedelta(hours=48)).isoformat()
    }, pk="session_id")

def load_progress(session_id) -> dict | None:
    db = sqlite_utils.Database(DB_PATH)
    try:
        row = dict(db["agent_progress"].get(session_id))
        if row["status"] == "in_progress" and row["expires_at"] > datetime.now().isoformat():
            return row
        return None
    except:
        return None
```

**Resume banner (shown on Home and Discover if in-progress exists):**
```
┌─────────────────────────────┐
│ ↩ Resume application        │
│ Visa Platinum Card          │
│ Step 4 of 6 · Paused        │
│                  [Resume →] │
└─────────────────────────────┘
```

**Partial progress rules:**
- Progress saved after every completed step, not just on cancel
- Partial progress expires after 48 hours
- Resuming re-loads `filled_data` into agent context — agent skips already-completed steps
- Expired progress shows "This application has expired. Start again?" banner instead

---

### Execution Agent — Core Logic

```python
# agents/execution/agent.py
from agents.base import run_agent
import json

PRODUCT_FLOWS = {
    "card":       ["fill_personal", "set_limit", "choose_delivery", "agree_terms", "otp_confirm"],
    "savings":    ["fill_personal", "set_initial_deposit", "choose_tenor", "agree_terms", "otp_confirm"],
    "loan":       ["fill_personal", "fill_employment", "set_loan_amount", "credit_check_consent", "agree_terms", "otp_confirm"],
    "home_loan":  ["fill_personal", "fill_employment", "fill_property", "document_checklist", "credit_check_consent", "agree_terms", "otp_confirm", "biometric_confirm"],
    "insurance":  ["fill_personal", "health_declaration", "choose_coverage", "choose_frequency", "agree_terms", "biometric_confirm"],
    "investment": ["fill_personal", "risk_acknowledgement", "set_amount", "set_recurring", "agree_prospectus", "otp_confirm"],
}

# Steps that are ALWAYS manual pause points — agent never auto-fills these
ALWAYS_PAUSE = {
    "health_declaration",    # sensitive personal health data
    "credit_check_consent",  # explicit regulatory consent required
    "risk_acknowledgement",  # regulatory — user must read and confirm
    "agree_prospectus",      # regulatory — user must confirm read
    "otp_confirm",           # security
    "biometric_confirm",     # security
}

SYSTEM = """You are a bank application agent working on behalf of the user.
You are given: the product type, user's profile, current step name, and already-filled data.

For each step, return ONLY valid JSON:
{
  "step": "step_name",
  "status": "done" | "paused",
  "input_type": null | "otp" | "biometric" | "clarification" | "document_upload" | "user_choice",
  "prompt": "message shown to user if paused (null if done)",
  "options": null | ["option1", "option2"],
  "filled_value": "what was auto-filled if done (null if paused)",
  "agent_log_entry": "human-readable description for summary card"
}

If the step is in the always-pause list, always return status: 'paused'.
If you can fill the step from the user profile, return status: 'done' with filled_value.
If info is missing from profile and needed, return status: 'paused' with input_type: 'clarification'."""

def process_step(step: str, product_type: str, profile: dict, filled_data: dict) -> dict:
    if step in ALWAYS_PAUSE:
        return _pause_step(step)

    context = f"""
Step to process: {step}
Product type: {product_type}
User profile: {json.dumps(profile)}
Already filled: {json.dumps(filled_data)}
"""
    result_text = run_agent(SYSTEM, context, tools=[], tool_fn_map={})
    try:
        return json.loads(result_text)
    except:
        return {"step": step, "status": "paused", "input_type": "clarification",
                "prompt": "We need some additional information to continue.", "filled_value": None,
                "agent_log_entry": f"Unable to process {step} automatically."}

def _pause_step(step: str) -> dict:
    pause_config = {
        "otp_confirm":        {"input_type": "otp",       "prompt": "Enter the OTP sent to your registered mobile number."},
        "biometric_confirm":  {"input_type": "biometric", "prompt": "Please verify your identity to continue."},
        "health_declaration": {"input_type": "user_choice","prompt": "Please complete the health declaration questions."},
        "credit_check_consent":{"input_type":"user_choice","prompt": "We need your consent to perform a credit check."},
        "risk_acknowledgement":{"input_type":"user_choice","prompt": "Please review and acknowledge the investment risk rating."},
        "agree_prospectus":   {"input_type": "user_choice","prompt": "Please confirm you have read the fund prospectus."},
    }
    cfg = pause_config.get(step, {"input_type": "clarification", "prompt": "Your input is required to continue."})
    return {"step": step, "status": "paused", "agent_log_entry": f"Paused at {step} — user input required.", **cfg}
```

---

## Product Action Types — Per Category

### Cards — "Apply for this card"

```
Agent steps:
  1. fill_personal       → auto (from profile)
  2. set_limit           → auto (50% of monthly income × 12)
  3. choose_delivery     → auto (primary address from profile)
                           PAUSE if multiple addresses on file
  4. card_design         → PAUSE: user picks from design options (if applicable)
  5. agree_terms         → auto
  6. otp_confirm         → PAUSE: user enters OTP

Pause points: 1–2 (card design optional + OTP)

Summary example:
  ✓ Personal details filled from profile
  ✓ $5,000 credit limit selected (based on income)
  ✓ Delivery to 123 Main St
  ✓ Terms & conditions agreed
  ! You selected card design: Midnight Black
  ! You confirmed with OTP
  Ref: VPC-2024-038821
  Approval: 3–5 working days · Card delivery: 7–10 days
```

---

### Savings — "Open this account"

```
Agent steps:
  Regular savings:
  1. fill_personal       → auto
  2. set_deposit_amount  → PAUSE: user enters initial deposit
  3. link_account        → auto (primary checking account)
  4. agree_terms         → auto
  5. otp_confirm         → PAUSE

  Fixed deposit (additional step):
  3b. choose_tenor       → PAUSE: user picks 3 / 6 / 12 / 24 months

Pause points: 2 (regular) or 3 (fixed deposit)

Summary example:
  ✓ Personal details filled
  ! You set initial deposit: $2,000
  ! You chose tenor: 12 months (fixed deposit)
  ✓ Funded from Checking ••4521
  ✓ Terms & conditions agreed
  ! You confirmed with OTP
  Ref: SAV-2024-119042
  Account active: immediately
```

---

### Loans — "Get a quote" / "Apply now"

```
Personal loan:
  1. fill_personal         → auto
  2. fill_employment       → auto (may PAUSE if gaps in profile)
  3. set_loan_amount       → PAUSE: user adjusts calculator slider
  4. credit_check_consent  → PAUSE: explicit user consent (always manual)
  5. agree_terms           → auto
  6. otp_confirm           → PAUSE

  Pause points: 3 (amount + consent + OTP)
  Result: indicative rate + monthly repayment (non-binding)

Home / car loan (more complex):
  1–3. Same as personal
  4. fill_property_details → PAUSE: user enters property/vehicle details
  5. document_checklist    → PAUSE: agent lists required docs, user confirms upload separately
  6. credit_check_consent  → PAUSE
  7. agree_terms           → auto
  8. otp_confirm           → PAUSE
  9. biometric_confirm     → PAUSE

  Pause points: 5 (details + docs + consent + OTP + biometric)

Summary example (personal loan):
  ✓ Personal & employment details filled
  ! You set: $20,000 over 36 months
  ! You agreed to credit check
  ✓ Terms agreed
  ! You confirmed with OTP
  Indicative rate: 6.5% p.a.
  Monthly repayment: ~$612
  Approval: 3–5 working days

Note: Credit check consent is always a manual pause — never auto-agreed by agent.
Note: Home/car loan document upload is handled separately outside agent flow.
```

---

### Insurance — "Get a quote" → "Purchase plan"

```
Agent steps:
  1. fill_personal        → auto
  2. health_declaration   → PAUSE: always manual (sensitive data)
  3. choose_coverage      → PAUSE: user picks Basic / Standard / Premium
  4. choose_frequency     → PAUSE: monthly or annually
     [Quote shown here — user reviews before proceeding]
  5. agree_terms          → auto
  6. biometric_confirm    → PAUSE (higher sensitivity product)

Pause points: 4 (health + coverage + frequency + biometric)

Summary example:
  ✓ Personal details filled
  ! You completed health declaration
  ! You selected: Standard coverage
  ! You chose: monthly payments ($45/mo)
  ✓ Terms & conditions agreed
  ! You confirmed with biometric
  Policy no: INS-2024-884421
  Coverage starts: immediately

Note: Health declaration is always manual — agent never fills health questions.
Note: Biometric (not OTP) used for insurance — higher value / longer commitment product.
```

---

### Investments — "Invest now"

```
Agent steps:
  1. fill_personal          → auto
  2. risk_acknowledgement   → PAUSE: always manual (regulatory requirement)
  3. set_amount             → PAUSE: user enters investment amount
  4. set_recurring          → PAUSE: one-time or monthly auto-invest (optional)
  5. link_account           → auto (primary account)
  6. agree_prospectus       → PAUSE: always manual (regulatory requirement)
  7. otp_confirm            → PAUSE

Pause points: 4–5 (risk ack + amount + recurring + prospectus + OTP)

Summary example:
  ✓ Personal details filled
  ! You acknowledged Risk Rating 4/7
  ! You invested: $5,000
  ! You set: $500/month recurring
  ✓ Funded from Checking ••4521
  ! You confirmed prospectus read
  ! You confirmed with OTP
  Units purchased: 1,234.56
  Portfolio ref: INV-2024-220811

Note: Risk acknowledgement and prospectus are always manual pauses — regulatory requirement.
```

---

### Promotions — "Activate offer" (no agent)

```
Pattern: one-tap — NO agent flow

Flow:
  1. User taps "Activate offer"
  2. Eligibility check (instant, client-side from profile)
  3. POST /promotions/{id}/activate
  4. Instant success state (no spinner, no pause points, no summary card)

Success state:
  ✓ Offer activated
  3% cashback on dining
  Valid until 31 Dec 2024
  Auto-applied to your Visa Platinum

Ineligible state (shown on product detail BEFORE user taps, not after):
  "This offer requires a Platinum card. Apply for one in Cards →"
```

---

## Backend Additions & API Endpoints

### New data models

```python
# models/bank.py

class Account(BaseModel):
    account_id:   str
    user_id:      str
    type:         str    # "checking" | "savings" | "loan" | "investment"
    balance:      float
    currency:     str    # "USD"
    account_no:   str    # masked for display (last 4 digits)
    status:       str    # "active" | "frozen"

class Transaction(BaseModel):
    txn_id:       str
    account_id:   str
    amount:       float  # negative = debit, positive = credit
    merchant:     str
    category:     str    # "food" | "income" | "subscription" | "transfer" | ...
    date:         str
    reference:    str

class Card(BaseModel):
    card_id:      str
    user_id:      str
    type:         str    # "credit" | "debit" | "prepaid"
    last_four:    str
    status:       str    # "active" | "frozen"
    spend_limit:  float
    network:      str    # "visa" | "mastercard"

class AgentProgress(BaseModel):
    session_id:   str
    product_id:   str
    product_type: str
    step_index:   int
    filled_data:  dict
    agent_log:    list[str]
    status:       str    # "in_progress" | "completed" | "expired"
    expires_at:   str

class Order(BaseModel):
    order_id:     str
    user_id:      str
    product_id:   str
    product_type: str
    status:       str    # "submitted" | "approved" | "rejected" | "cancelled"
    agent_log:    list[str]
    reference_no: str
    created_at:   str
```

---

### API endpoints — full list

```
Bank core:
GET    /accounts/{user_id}              → list all accounts + balances
GET    /accounts/{account_id}/txns      → transaction history (paginated, filterable)
GET    /cards/{user_id}                 → list cards
PATCH  /cards/{card_id}/freeze          → freeze / unfreeze card
POST   /transfers                       → initiate transfer (returns OTP challenge)
POST   /transfers/{id}/confirm          → confirm transfer with OTP

Discover / AI advisory:
POST   /advise                          → full AI pipeline (existing, unchanged)
POST   /followup                        → intent router (existing)
GET    /products?type={type}            → list products by category
GET    /products/{id}                   → product detail (type-aware)
POST   /products/compare                → side-by-side comparison (same category)
GET    /promotions                      → list active promotions
POST   /promotions/{id}/activate        → one-tap activate promotion

Agent execution:
POST   /execute/start                   → start agent flow for a product
       body: {product_id, product_type, user_id, session_id}
       returns: {step, status, needs_input, input_type, prompt, options, agent_log}

POST   /execute/resume                  → provide user input and continue
       body: {session_id, input_type, value}
       returns: same shape as /execute/start

GET    /execute/progress/{session_id}   → load saved partial progress
DELETE /execute/cancel/{session_id}     → cancel and save progress to DB

GET    /orders/{user_id}                → list submitted orders + status
GET    /agent-history/{user_id}         → all completed agent actions with summaries

Goals:
GET    /goals/{user_id}                 → list active goals
POST   /goals                           → create goal
PATCH  /goals/{goal_id}                 → modify goal (amount, deadline)
DELETE /goals/{goal_id}                 → cancel goal
```

**All endpoints return consistent shape:**
```json
{ "success": true, "data": {}, "error": null }
```

---

### Products.json — extended schema

```json
{
  "id": "CC-001",
  "name": "Visa Platinum",
  "product_type": "card",
  "category": "cards",
  "sub_type": "credit",
  "risk_level": "low",
  "eligible_goals": ["rewards", "travel"],
  "summary": {
    "annual_fee": 180,
    "cashback_pct": 3.0,
    "min_income": 30000,
    "min_credit_score": 680,
    "network": "visa"
  },
  "detail": {
    "tagline": "Earn 3% cashback on every purchase.",
    "benefits": ["3% cashback", "Airport lounge access", "Travel insurance"],
    "fees": {
      "late_payment": 35,
      "forex_pct": 1.5,
      "cash_advance_pct": 5.0
    },
    "faqs": [
      {"q": "When is the annual fee charged?", "a": "On your card anniversary date."},
      {"q": "How do I redeem cashback?",       "a": "Automatically credited monthly."}
    ],
    "terms_summary": "Subject to credit approval. Annual fee waived first year."
  },
  "agent_flow": "card",
  "cta_label": "Apply for this card"
}
```

**Key fields:**
- `product_type` — drives frontend layout template AND agent flow step list
- `agent_flow` — maps to `PRODUCT_FLOWS` key in the execution agent
- `cta_label` — stored per-product so special cases (e.g. "Get a quote") can override the default

---

## Build Order & Folder Structure

### Build order (10 phases)

```
Phase 1   Data models + extended products.json schema
Phase 2   Core bank endpoints (accounts, transactions, cards)
Phase 3   Execution agent + /execute/start + /execute/resume endpoints
Phase 4   Mobile: design tokens, shared components, Home + Accounts tabs
Phase 5   Mobile: Transfer tab
Phase 6   Mobile: Discover tab — category listing + per-type product detail templates
Phase 7   Mobile: Agent execution screen (spinner → pause states → summary card)
Phase 8   Mobile: Profile tab + Agent history screen
Phase 9   Connect all screens to real API (replace mock data throughout)
Phase 10  Polish — animations, error states, resume banner, expired progress handling
```

**Rule: test every backend endpoint with curl before building the UI against it. Never let a screen block on an unfinished endpoint.**

---

### Final folder structure

```
finance-advisor/
├── agents/
│   ├── base.py
│   ├── supervisor/
│   ├── profiling/
│   ├── risk_planning/
│   ├── recommendation/
│   ├── intent_router/
│   ├── followup/
│   ├── execution/
│   │   └── agent.py          ← PRODUCT_FLOWS + step processor
│   └── verifier/
├── tools/
│   ├── user_profile/
│   ├── financial_intel/
│   │   └── simulator.py
│   ├── product_catalog/
│   │   └── detail.py
│   ├── goals/
│   │   └── tracker.py
│   ├── execution/
│   │   ├── service.py        ← apply_product, cancel_order
│   │   └── progress.py       ← save/load partial progress
│   └── reporting/
├── models/
│   ├── user.py
│   ├── assessment.py
│   ├── recommendation.py
│   └── bank.py               ← Account, Transaction, Card, Order, AgentProgress
├── data/
│   ├── db.sqlite
│   └── products.json         ← extended with product_type, agent_flow, cta_label
├── mobile/
│   ├── app/
│   │   └── (tabs)/
│   │       ├── home.tsx
│   │       ├── accounts/
│   │       │   ├── index.tsx         ← accounts list
│   │       │   ├── [id].tsx          ← account detail + transactions
│   │       │   └── cards.tsx         ← cards management
│   │       ├── transfer/
│   │       │   ├── index.tsx
│   │       │   └── confirm.tsx
│   │       ├── discover/
│   │       │   ├── index.tsx         ← discover home
│   │       │   ├── [category].tsx    ← category listing
│   │       │   ├── product/[id].tsx  ← type-aware product detail
│   │       │   ├── compare.tsx
│   │       │   └── chat.tsx
│   │       └── profile/
│   │           ├── index.tsx
│   │           ├── products.tsx      ← active products
│   │           ├── goals.tsx
│   │           └── agent-history.tsx
│   ├── components/
│   │   ├── execution/
│   │   │   ├── ExecutionScreen.tsx   ← manages all 3 states
│   │   │   ├── SummaryCard.tsx
│   │   │   └── PausePrompt.tsx       ← OTP / biometric / clarification
│   │   ├── products/
│   │   │   ├── ProductShell.tsx      ← shared wrapper (nav, CTA, chat strip)
│   │   │   ├── CardDetail.tsx
│   │   │   ├── SavingsDetail.tsx
│   │   │   ├── LoanDetail.tsx        ← includes repayment calculator
│   │   │   ├── InsuranceDetail.tsx
│   │   │   ├── InvestmentDetail.tsx  ← includes returns chart
│   │   │   └── PromoDetail.tsx
│   │   └── bank/
│   │       ├── AccountCard.tsx
│   │       ├── TransactionRow.tsx
│   │       ├── CardVisual.tsx        ← navy/gold card display
│   │       ├── BalanceSummary.tsx
│   │       ├── ScoreRing.tsx
│   │       └── GoalBar.tsx
│   ├── services/
│   │   └── api.ts                    ← all Axios calls, single base URL
│   ├── store/
│   │   └── session.ts                ← Zustand store, persisted to AsyncStorage
│   └── theme/
│       └── tokens.ts                 ← colours, typography, spacing constants
├── tests/
├── api.py
├── main.py
└── requirements.txt
```

---

*Full bank app. AI-powered execution. Transparent agent actions.*
