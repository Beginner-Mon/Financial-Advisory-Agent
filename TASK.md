# TASK.md — Agentic Finance Advisory System

> Checklist for building the system phase-by-phase. Each item has a verification criterion.
> Mark `[x]` when done, `[/]` when in progress.

---

## Phase 0 — Project Scaffold & Local Environment

### Step 0.1 — Folder Structure
- [x] Create monorepo folder structure under `finance-advisor/`
  - [x] `agents/` with subdirs: `supervisor/`, `profiling/`, `risk_planning/`, `recommendation/`, `verifier/`
  - [x] `tools/` with subdirs: `user_profile/`, `financial_intel/`, `product_catalog/`, `reporting/`
  - [x] `models/` directory
  - [x] `data/` directory
  - [x] `tests/` directory
  - [x] All `__init__.py` files in every package
- **✅ Verify:** All directories exist, `python -c "import agents; import tools; import models"` works ✅ PASSED

### Step 0.2 — Python Environment & Dependencies
- [x] Create `pyproject.toml` with project metadata and dependencies
- [x] Create `requirements.txt` with pinned versions
- [x] Create `.env.example` with `ANTHROPIC_API_KEY=your-key-here`
- [x] Create `.gitignore` (venv, __pycache__, .env, data/db.sqlite)
- [x] Set up virtual environment: `python -m venv .venv`
- [x] Install dependencies: `pip install -r requirements.txt`
- **✅ Verify:** `python -m pytest --collect-only` runs without import errors ✅ PASSED

### Step 0.3 — Config Module
- [x] Create `config.py` with centralized settings (DB_PATH, CATALOG_PATH, API key loading)
- [x] Use `pathlib.Path` for all file paths
- [x] Load `.env` via `python-dotenv`
- **✅ Verify:** `python -c "from config import settings; print(settings.DB_PATH)"` prints correct path ✅ PASSED

### Step 0.4 — Shared Data Models (Pydantic)
- [x] Create `models/enums.py` with `JobStability`, `RiskTolerance`, `RiskProfile` enums
- [x] Create `models/user.py` with `UserProfile` model
  - [x] Fields: user_id, age, income, credit_score, job_stability, risk_tolerance, goals, financial_holdings
  - [x] Validators: credit_score 300–850, income ≥ 0, age > 0
- [x] Create `models/assessment.py` with `RiskAssessment` model
  - [x] Fields: health_score (0–100), risk_profile, liquidity_ratio, debt_ratio, plan_steps
- [x] Create `models/recommendation.py` with `ProductRecommendation` model
  - [x] Fields: product_id, name, type, rationale, return_pct
- **✅ Verify:** Model validation rejects invalid data, goal normalization works ✅ PASSED

---

## Phase 1 — Build the 4 Tool Modules

### Step 1.1 — User Profile Tool
- [x] Create `tools/user_profile/service.py`
  - [x] `save_profile(profile, db_path=None)` — upsert to SQLite
  - [x] `get_profile(user_id, db_path=None)` — retrieve from SQLite
  - [x] `validate_and_enrich(raw_dict)` — fill defaults, return `UserProfile`
- [x] Create `tests/test_user_profile.py`
- **✅ Verify:** `python -m pytest tests/test_user_profile.py -v` — all pass ✅ PASSED

### Step 1.2 — Financial Intelligence Tool
- [x] Create `tools/financial_intel/engine.py`
  - [x] `compute_health_score(profile)` → float 0–100
  - [x] `compute_risk_profile(profile)` → "conservative" | "moderate" | "aggressive"
  - [x] `generate_plan_steps(profile, risk)` → list[str]
  - [x] `build_financial_plan(profile)` → `RiskAssessment`
- [x] Create `tests/test_financial_intel.py`
- **✅ Verify:** `python -m pytest tests/test_financial_intel.py -v` — all pass ✅ PASSED

### Step 1.3 — Product Catalog Tool
- [x] Create `data/products.json` with 15–20 products (savings, investment, loan, insurance)
- [x] Create `tools/product_catalog/service.py`
  - [x] `load_products(catalog_path=None)` — load JSON with caching
  - [x] `get_recommendations(risk_profile, goals, credit_score)` → list[dict]
- [x] Create `tests/test_product_catalog.py`
- **✅ Verify:** `python -m pytest tests/test_product_catalog.py -v` — all pass ✅ PASSED

### Step 1.4 — Reporting Tool
- [x] Create `tools/reporting/generator.py`
  - [x] `generate_report(profile, assessment, recs)` → markdown string
- [x] Create `tests/test_reporting.py`
- **✅ Verify:** `python -m pytest tests/test_reporting.py -v` — all pass ✅ PASSED

### Phase 1 Gate Check
- [x] **All 4 tool test suites pass:** `python -m pytest tests/ -v` — **43 passed** ✅
- [x] No AI/API calls needed — everything is pure Python

---

## Phase 2 — Build Agents One at a Time

### Step 2.1 — Agent Base Scaffolding
- [x] Create `agents/base.py` with `run_agent()`, tool-use loop, retry logic
- **✅ Verify:** Base function importable, handles mock tool call ✅ PASSED

### Step 2.2 — Profiling Agent
- [x] Create `agents/profiling/agent.py`
- **✅ Verify:** Importable, tool schema defined ✅ PASSED

### Step 2.3 — Risk & Planning Agent
- [x] Create `agents/risk_planning/agent.py`
- **✅ Verify:** Importable, wired to financial_intel engine ✅ PASSED

### Step 2.4 — Recommendation Agent
- [x] Create `agents/recommendation/agent.py`
- **✅ Verify:** Importable, wired to product_catalog ✅ PASSED

### Step 2.5 — Supervisor / Orchestrator
- [x] Create `agents/supervisor/agent.py` with `run_full_pipeline()`
- **✅ Verify:** Importable, pipeline function callable ✅ PASSED

---

## Phase 3 — Integration & Local Testing

### Step 3.1 — End-to-End CLI
- [x] Create `main.py` with `--session`, `--json`, `--help`, `--verify` flags
- **✅ Verify:** `python main.py --help` displays usage ✅ PASSED

### Step 3.2 — Verifier Agent
- [x] Create `agents/verifier/agent.py`
- **✅ Verify:** Importable, wired to CLI --verify flag ✅ PASSED

### Step 3.3 — Conversation Memory
- [x] Create `tools/user_profile/memory.py`
- **✅ Verify:** Importable, save/load functions callable ✅ PASSED

### Step 3.4 — FastAPI Layer
- [x] Create `api.py` with `POST /advise`, `GET /health`, CORS middleware
- **✅ Verify:** Importable, endpoints defined ✅ PASSED

### Phase 3 Gate Check
- [x] All imports verified for all agents and tools
- [x] All 43 unit tests still pass: `python -m pytest tests/ -v` ✅

---

## Phase 4 — Polish & Demo Readiness

### Step 4.1 — Rich Console Output
- [x] Colour-coded Rich Panel, progress spinner in main.py
- **✅ Verify:** Rich formatting in main.py ✅ PASSED

### Step 4.2 — Error Handling & Fallbacks
- [x] Wrap pipeline call in try/except, handle missing API key
- **✅ Verify:** Missing key message shown ✅ PASSED

### Step 4.3 — Demo Scenarios
- [x] Prepare 4 canned test inputs, script at `tests/demo_scenarios.py`
- **✅ Verify:** Script importable, scenarios defined ✅ PASSED

### Step 4.4 — Final Documentation
- [x] `python main.py --help` works ✅ PASSED

---

## Summary Gate Check — Phases 0–4

| Phase | Gate Criterion | Status |
|-------|---------------|--------|
| 0 | Packages importable, pytest collects | ✅ PASSED |
| 1 | All 4 tool test suites pass (43 tests) | ✅ PASSED |
| 2 | All agents importable, supervisor pipeline callable | ✅ PASSED |
| 3 | CLI --help works, FastAPI importable, 43 tests pass | ✅ PASSED |
| 4 | Rich output, error handling, demo scenarios ready | ✅ PASSED |

---

---

# ══════════════════════════════════════════════
# PHASES 5–10 — Full Bank App + UI
# ══════════════════════════════════════════════

> **Context:** Backend AI pipeline is complete. Now extending to a full bank app UI.
> Backend: FastAPI in `finance-advisor/` running on `http://localhost:8000`
> Frontend: React Native (Expo) in `finance-advisor-app/` running on `http://localhost:8081`

---

## Phase 5 — Extended Data Models & Bank Endpoints

### Step 5.1 — Bank Data Models
- [x] Create `finance-advisor/models/bank.py`
  - [x] `Account` — account_id, user_id, type, balance, currency, account_no, status
  - [x] `Transaction` — txn_id, account_id, amount, merchant, category, date, reference
  - [x] `Card` — card_id, user_id, type, last_four, status, spend_limit, network
  - [x] `AgentProgress` — session_id, product_id, product_type, step_index, filled_data, agent_log, status, expires_at
  - [x] `Order` — order_id, user_id, product_id, product_type, status, agent_log, reference_no, created_at
- [x] Add `__init__.py` exports for all new models
- **✅ Verify:** `python -c "from models.bank import Account, Transaction, Card, AgentProgress, Order"` works ✅ PASSED

### Step 5.2 — Extended products.json
- [x] Add fields to every product entry in `finance-advisor/data/products.json`:
  - [x] `product_type` — "card" | "savings" | "loan" | "home_loan" | "insurance" | "investment" | "promotion"
  - [x] `category` — "cards" | "savings" | "loans" | "insurance" | "investments" | "promotions"
  - [x] `sub_type` — e.g. "credit", "fixed_deposit", "personal", "life"
  - [x] `agent_flow` — maps to PRODUCT_FLOWS key
  - [x] `cta_label` — e.g. "Apply for this card", "Open this account", "Invest now"
  - [x] `risk_level` — "low" | "moderate" | "high"
  - [x] `eligible_goals` — list of goal strings
  - [x] `detail` — full detail object (tagline, benefits, fees, faqs, terms_summary)
- [x] Add at least 3 products for each category (cards, savings, loans, insurance, investments, promotions)
- **✅ Verify:** `python -c "import json; d=json.load(open('data/products.json')); assert all('product_type' in p for p in d)"` passes ✅ PASSED

### Step 5.3 — Seed SQLite with Mock Bank Data
- [x] Create `finance-advisor/tools/seed_db.py`
  - [x] Seed 2 mock accounts per demo user (checking + savings)
  - [x] Seed 20 mock transactions per account
  - [x] Seed 2 mock cards per demo user
  - [x] Use a fixed demo user_id: `"user-demo-001"`
- [x] Run seed script: `cd finance-advisor && python tools/seed_db.py`
- **✅ Verify:** `python -c "import sqlite_utils; db=sqlite_utils.Database('data/db.sqlite'); print(list(db['accounts'].all()))"` shows rows ✅ PASSED

### Step 5.4 — Core Bank API Endpoints
- [x] Add to `finance-advisor/api.py`:
  - [x] `GET /accounts/{user_id}` — returns list of accounts + balances
  - [x] `GET /accounts/{account_id}/txns` — paginated transaction history (query params: `page`, `limit`, `category`, `search`)
  - [x] `GET /cards/{user_id}` — returns list of cards
  - [x] `PATCH /cards/{card_id}/freeze` — body: `{freeze: bool}`, toggles card status
  - [x] `POST /transfers` — body: `{from_account, to_account, amount, reference}`, returns OTP challenge token
  - [x] `POST /transfers/{transfer_id}/confirm` — body: `{otp}`, returns success + reference number
- [x] All responses use shape: `{ "success": true, "data": {}, "error": null }`
- [x] Start server: `cd finance-advisor && uvicorn api:app --reload --port 8000`
- **✅ Verify (curl):** ✅ PASSED
  ```
  curl http://localhost:8000/accounts/user-demo-001
  curl http://localhost:8000/cards/user-demo-001
  ```

### Step 5.5 — Discover / Product API Endpoints
- [x] Add to `finance-advisor/api.py`:
  - [x] `GET /products?type={type}` — list products filtered by category
  - [x] `GET /products/{id}` — single product detail (type-aware full object)
  - [x] `POST /products/compare` — body: `{ids: [id1, id2]}`, same category only, returns side-by-side + agent note
  - [x] `GET /promotions` — list active promotions
  - [x] `POST /promotions/{id}/activate` — body: `{user_id}`, returns instant success
- **✅ Verify (curl):** ✅ PASSED
  ```
  curl "http://localhost:8000/products?type=cards"
  curl http://localhost:8000/products/CC-001
  curl http://localhost:8000/promotions
  ```

### Step 5.6 — Goals API Endpoints
- [x] Add to `finance-advisor/api.py`:
  - [x] `GET /goals/{user_id}` — list active goals
  - [x] `POST /goals` — body: `{user_id, name, target_amount, deadline}`, creates goal
  - [x] `PATCH /goals/{goal_id}` — update goal amount or deadline
  - [x] `DELETE /goals/{goal_id}` — cancel goal
- [x] Create `finance-advisor/tools/goals/tracker.py` with CRUD backing SQLite table
- **✅ Verify (curl):** `curl http://localhost:8000/goals/user-demo-001` ✅ PASSED

### Phase 5 Gate Check
- [x] `python -m pytest tests/ -v` — all 43 original tests still pass
- [x] All new endpoints return `200` with correct shape — **11/11 PASS** (verified via `tests/verify_phase56.py`)
- [x] `finance-advisor/.env` has a valid `ANTHROPIC_API_KEY`

---

## Phase 6 — Execution Agent & Execution Endpoints

### Step 6.1 — Execution Agent Core
- [x] Create `finance-advisor/agents/execution/agent.py`
  - [x] Define `PRODUCT_FLOWS` dict:
    ```python
    PRODUCT_FLOWS = {
      "card":       ["fill_personal","set_limit","choose_delivery","agree_terms","otp_confirm"],
      "savings":    ["fill_personal","set_initial_deposit","choose_tenor","agree_terms","otp_confirm"],
      "loan":       ["fill_personal","fill_employment","set_loan_amount","credit_check_consent","agree_terms","otp_confirm"],
      "home_loan":  ["fill_personal","fill_employment","fill_property","document_checklist","credit_check_consent","agree_terms","otp_confirm","biometric_confirm"],
      "insurance":  ["fill_personal","health_declaration","choose_coverage","choose_frequency","agree_terms","biometric_confirm"],
      "investment": ["fill_personal","risk_acknowledgement","set_amount","set_recurring","link_account","agree_prospectus","otp_confirm"],
    }
    ```
  - [x] Define `ALWAYS_PAUSE` set: `{"health_declaration","credit_check_consent","risk_acknowledgement","agree_prospectus","otp_confirm","biometric_confirm"}`
  - [x] Implement `process_step(step, product_type, profile, filled_data)` → dict with keys: step, status, input_type, prompt, options, filled_value, agent_log_entry
  - [x] Implement `_pause_step(step)` returning correct input_type and prompt per step
  - [x] Steps not in ALWAYS_PAUSE: call `run_agent()` to auto-fill from profile; fallback to clarification pause on failure
- **✅ Verify:** `python -c "from agents.execution.agent import PRODUCT_FLOWS, process_step; print('ok')"` works ✅ PASSED

### Step 6.2 — Execution Progress Persistence
- [x] Create `finance-advisor/tools/execution/progress.py`
  - [x] `save_progress(session_id, product_id, product_type, step_index, filled_data, agent_log)` — upsert to SQLite `agent_progress` table
  - [x] `load_progress(session_id)` → dict or None (None if expired or not found)
  - [x] Progress expires after 48 hours (check `expires_at` field)
- [x] Create `finance-advisor/tools/execution/service.py`
  - [x] `apply_product(order_data)` — insert into SQLite `orders` table, return reference_no
  - [x] `cancel_order(session_id)` — update status to "cancelled"
- **✅ Verify:** `python -c "from tools.execution.progress import save_progress, load_progress; print('ok')"` works ✅ PASSED

### Step 6.3 — Execution API Endpoints
- [x] Add to `finance-advisor/api.py`:
  - [x] `POST /execute/start` — body: `{product_id, product_type, user_id, session_id}` → starts agent flow at step 0, returns first step result
  - [x] `POST /execute/resume` — body: `{session_id, input_type, value}` → processes user input, advances to next step
  - [x] `GET /execute/progress/{session_id}` — returns saved partial progress (for resume banner)
  - [x] `DELETE /execute/cancel/{session_id}` — cancels session, saves to DB
  - [x] `GET /orders/{user_id}` — list submitted orders
  - [x] `GET /agent-history/{user_id}` — completed agent actions with full agent_log
- [x] Response for `/execute/start` and `/execute/resume`:
  ```json
  {
    "step": "fill_personal",
    "status": "done" | "paused",
    "step_index": 0,
    "total_steps": 5,
    "input_type": null | "otp" | "biometric" | "clarification" | "user_choice",
    "prompt": null | "string",
    "options": null | ["opt1", "opt2"],
    "filled_value": null | "string",
    "agent_log": ["step1 done", ...],
    "complete": false | true,
    "reference_no": null | "VPC-2024-XXXXXX"
  }
  ```
- **✅ Verify (curl):**
  ```
  curl -X POST http://localhost:8000/execute/start \
    -H "Content-Type: application/json" \
    -d '{"product_id":"CC-001","product_type":"card","user_id":"user-demo-001","session_id":"sess-001"}'
  ```

### Phase 6 Gate Check
- [x] `/execute/start` returns correct first step for each product_type
- [x] `/execute/resume` with `{"input_type":"otp","value":"123456"}` advances the flow
- [x] `load_progress` returns None for expired sessions
- [x] `GET /execute/progress/sess-001` returns saved state

---

## Phase 7 — Mobile: Foundation & Home + Accounts Tabs

> **Local setup:** Expo app in `finance-advisor-app/`. API base URL: `http://localhost:8000`
> Run: `cd finance-advisor-app && npx expo start`
> On Android emulator use: `http://10.0.2.2:8000` instead of localhost

### Step 7.1 — Expo Project Setup
- [x] Initialise Expo app (if not already done): `cd finance-advisor-app && npx create-expo-app@latest . --template blank-typescript`
- [x] Install dependencies:
  ```
  npx expo install expo-router react-native-safe-area-context react-native-screens
  npx expo install @react-native-async-storage/async-storage
  npm install axios zustand
  npm install react-native-reanimated react-native-gesture-handler
  ```
- [x] Configure `expo-router` entry point in `app.json`
- [x] Create file-based route structure under `app/(tabs)/`
- **✅ Verify:** `npx tsc --noEmit` — 0 errors ✅ PASSED

### Step 7.2 — Design Tokens & Theme
- [x] Create `finance-advisor-app/constants/theme.ts` (extended from existing)
  - [x] Colours: navy `#0A1628`, gold `#C9A84C`, white, background greys, success green, error red
  - [x] Typography: font sizes (xs=11, sm=13, md=15, lg=18, xl=24, xxl=32), font weights
  - [x] Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48
  - [x] Border radius: sm=4, md=8, lg=16, full=9999
- [x] Shadows included in `constants/theme.ts` — elevation presets (sm, md, lg, gold)
- **✅ Verify:** Import tokens in any component without error ✅ PASSED

### Step 7.3 — API Service Layer
- [x] Create `finance-advisor-app/services/api.ts`
  - [x] Generic helpers (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`) with error normalisation
  - [x] Typed functions for every backend endpoint:
    - [x] `getAccounts(userId)`, `getTransactions(accountId, params)`, `getCards(userId)`, `freezeCard(cardId, freeze)`
    - [x] `getProducts(type?)`, `getProductDetail(id)`, `compareProducts(ids)`, `getPromotions()`, `activatePromotion(id, userId)`
    - [x] `startExecution(body)`, `resumeExecution(body)`, `getExecutionProgress(sessionId)`, `cancelExecution(sessionId)`
    - [x] `getOrders(userId)`, `getAgentHistory(userId)`
    - [x] `getAdvice(message, sessionId)`, `checkHealth()`
    - [x] `getGoals`, `createGoal`, `updateGoal`, `deleteGoal`
    - [x] `initiateTransfer`, `confirmTransfer`
- [x] Create `.env` in `finance-advisor-app/`
- **✅ Verify:** All API functions importable ✅ PASSED

### Step 7.4 — Global State (Zustand)
- [x] Create `finance-advisor-app/store/session.ts`
  - [x] Fields: `userId`, `profile`, `activeExecutionSessionId`, `executionState`, `inProgressProduct`
  - [x] Persist to AsyncStorage via Zustand middleware
  - [x] Actions: `setUserId`, `setProfile`, `startExecution`, `updateExecution`, `clearExecution`, `reset`
- **✅ Verify:** Store importable ✅ PASSED

### Step 7.5 — Shared Components (Bank)
- [x] Create `finance-advisor-app/components/bank/`:
  - [x] `BalanceSummary.tsx` — large balance display, trend indicator
  - [x] `AccountCard.tsx` — pill card with account type, masked number, balance
  - [x] `TransactionRow.tsx` — merchant, amount (colour-coded +/-), category badge, date
  - [x] `CardVisual.tsx` — navy/gold card with chip, network logo, last 4 digits, frozen state
  - [x] `ScoreRing.tsx` — SVG circular progress ring for financial health score (0–100)
  - [x] `GoalBar.tsx` — progress bar with goal name, current/target amounts
- **✅ Verify:** All 6 components created ✅ PASSED

### Step 7.6 — Bottom Tab Navigator
- [x] Create `app/(tabs)/_layout.tsx` with 5 tabs: Home, Accounts, Transfer, Discover, Profile
  - [x] Tab icons (use `@expo/vector-icons` Ionicons) with active/inactive variants
  - [x] Active tab colour: gold `#C9A84C` with background highlight; inactive: grey
  - [x] Tab bar background: dark surface with subtle top border
- **✅ Verify:** Tab layout created with all 5 screen routes ✅ PASSED

### Step 7.7 — Home Screen
- [x] Create `app/(tabs)/home.tsx`
  - [x] Fetch `GET /accounts/{userId}` on mount, aggregate total balance
  - [x] Show `BalanceSummary` with total balance + month trend
  - [x] Scrollable account pill strip — tap switches selected account + reloads txns
  - [x] Quick actions grid: Transfer, Cards, Invest, AI Advisor
  - [x] Resume banner (conditional): shown if `store.inProgressProduct` exists
    - [x] Tapping resume navigates to discover screen
  - [x] AI Advisor nudge banner at bottom
  - [x] Recent transactions list (last 5, from selected account)
- **✅ Verify:** Home screen created with all sections ✅ PASSED

### Step 7.8 — Accounts Tab
- [x] Create `app/(tabs)/accounts.tsx` — combined accounts/cards with segment control
  - [x] Accounts view: list all accounts with type icon, masked number, balance
  - [x] Pull-to-refresh on all views
- [x] Account detail view (inline, via view mode switch)
  - [x] Account header: type, masked number, balance
  - [x] Filter pills: All, In, Out + Search
  - [x] Grouped transaction list (Today / Yesterday / date headers)
  - [x] Transaction detail bottom sheet modal on row tap (merchant, amount, category, reference)
- [x] Cards management view (via segment control)
  - [x] Card carousel with `CardVisual` + dot navigation
  - [x] Freeze/unfreeze toggle → calls `PATCH /cards/{id}/freeze` with optimistic update
  - [x] Card controls: monthly limit display, online txns toggle
  - [x] "View PIN" button, "Report Lost" button (styled danger)
- **✅ Verify:**
  - Accounts list fetches from API ✅
  - Freeze card toggle uses optimistic update ✅
  - Transaction detail modal implemented ✅

### Phase 7 Gate Check
- [x] `npx tsc --noEmit` — 0 TypeScript errors
- [x] All 3 Accounts sub-views render with real API data
- [x] Freeze card toggle reflected in UI state immediately (optimistic update)
- [x] Backend `python -m pytest tests/ -v` — all 43 tests still pass

---

## Phase 8 — Mobile: Transfer Tab

> **Security rule:** Agent never initiates transfers. This flow is always manual.

### Step 8.1 — Transfer Home Screen
- [x] Created `app/(tabs)/transfer.tsx` (single file with internal step management)
  - [x] "New Transfer" CTA button with gold styling
  - [x] Saved payees list (4 mock payees with avatars)
  - [x] Scheduled payments section (placeholder)
- **✅ Verify:** Transfer home renders ✅ PASSED

### Step 8.2 — New Transfer Flow (4-step)
- [x] Step 1: Recipient (inline view in transfer.tsx)
  - [x] Saved payees list with search filter
  - [x] "+ New payee" form: name, bank, account number fields
  - [x] Continue disabled until payee selected
- [x] Step 2: Amount & details
  - [x] Large amount input with hero-sized font
  - [x] Quick amount buttons ($50, $100, $250, $500, $1000)
  - [x] From-account picker (lists user accounts with balance)
  - [x] Optional reference/note field
- [x] Step 3: Review
  - [x] Summary card: To, Bank, Account (masked), Amount, Reference, From
  - [x] Security note with shield icon
  - [x] "Confirm & Send OTP" → calls `POST /transfers`, receives OTP challenge
- [x] Step 4: OTP
  - [x] 6-digit OTP input field with center alignment + letter spacing
  - [x] Resend timer (60s countdown) with gold highlight
  - [x] On submit → calls `POST /transfers/{id}/confirm`
  - [x] On success → Success screen with animated checkmark + reference number + "Save payee" option
- [x] Step transitions with fade animations + progress bar (25% → 50% → 75% → 100%)
- **✅ Verify (API tested):**
  - `POST /transfers` returns 200 with transfer_id ✅
  - `POST /transfers/{id}/confirm` returns 200 with reference_no ✅
- **✅ Verify:** Full 4-step flow navigable; OTP screen shows resend timer ✅ PASSED

### Phase 8 Gate Check
- [x] Transfer flow completes end-to-end with mock OTP (any 6-digit code accepted in dev mode)
- [x] Success screen shows reference number with animated checkmark
- [x] Back navigation works at every step (stepHeader with back button)
- [x] `npx tsc --noEmit` — 0 TypeScript errors
- [x] Backend bug fixed: global exception handler no longer swallows HTTPExceptions
- [x] Backend bug fixed: `pending_transfers.upsert(alter=True)` for new columns
- [x] Backend `python -m pytest tests/ -v` — all 43 tests still pass

---

## Phase 9 — Mobile: Discover Tab

### Step 9.1 — Discover Home Screen
- [ ] Create `app/(tabs)/discover/index.tsx`
  - [ ] `ScoreRing` with financial health score (from `/advise` or stored)
  - [ ] "Recommended for you" horizontal strip — AI picks (top 3 from `GET /products` filtered by stored profile)
  - [ ] Category grid: Cards, Savings, Loans, Insurance, Investments, Promotions (2×3)
  - [ ] Current promotions list (from `GET /promotions`)
  - [ ] Persistent chat bar at bottom — tapping navigates to AI chat screen
- **Verify:** Discover home renders; category tiles navigate to correct category listing

### Step 9.2 — Category Listing Screen
- [ ] Create `app/(tabs)/discover/[category].tsx`
  - [ ] Fetches `GET /products?type={category}` on mount
  - [ ] Sub-type filter pills (e.g. All, Cashback, Travel for Cards)
  - [ ] Product list cards: name, key metric (cashback%/rate/etc.), CTA button
  - [ ] "★ AI Pick" badge on recommended items
  - [ ] Compare toggle: select up to 2 items → "Compare" button appears
  - [ ] Tapping product card navigates to product detail
  - [ ] Tapping CTA button navigates directly to execution flow
- **Verify:** Cards category shows at least 3 products; compare button appears after selecting 2

### Step 9.3 — Product Detail Screens (Type-Aware)
- [ ] Create `finance-advisor-app/components/products/ProductShell.tsx` — shared wrapper (back nav, sticky CTA, chat strip)
- [ ] Create per-type detail components:
  - [ ] `CardDetail.tsx` — card visual, annual fee, rewards rate, benefits list, eligibility, fees table
  - [ ] `SavingsDetail.tsx` — interest rate (large), account type badge, rate tiers table, lock-in period, deposit insurance badge
  - [ ] `LoanDetail.tsx` — loan type badge, interest range, loan calculator widget (amount slider × tenure → monthly repayment), docs checklist, eligibility
  - [ ] `InsuranceDetail.tsx` — coverage summary, premium estimate (monthly/annual toggle), exclusions accordion, claim process steps
  - [ ] `InvestmentDetail.tsx` — fund type, risk rating visual (1–7 scale), historical returns chart (1y/3y/5y tabs), min investment, platform fee
  - [ ] `PromoDetail.tsx` — offer headline, expiry badge, eligibility result, T&C accordion, activation steps
- [ ] Create `app/(tabs)/discover/product/[id].tsx`
  - [ ] Fetch `GET /products/{id}` on mount
  - [ ] Render correct detail component based on `product_type`
  - [ ] CTA label from `product.cta_label`
  - [ ] Tapping CTA starts execution flow
- **Verify:** Navigate to a Card product → CardDetail renders; navigate to a Savings product → SavingsDetail renders

### Step 9.4 — Compare Screen
- [ ] Create `app/(tabs)/discover/compare.tsx`
  - [ ] Receives two product IDs via route params
  - [ ] Calls `POST /products/compare` → receives side-by-side data + agent note
  - [ ] Renders comparison table (green highlight = better value per row)
  - [ ] Agent note shown at bottom
  - [ ] "Apply" CTA under each column starts execution for that product
- **Verify:** Selecting 2 cards and comparing shows correct highlighted differences

### Step 9.5 — AI Chat Screen
- [ ] Create `app/(tabs)/discover/chat.tsx`
  - [ ] Message list (scrollable, time-stamped bubbles)
  - [ ] Text input + send button at bottom
  - [ ] On send → calls `POST /advise` (or a `/chat` variant) with session_id
  - [ ] Typing indicator while waiting for response
  - [ ] Support for markdown rendering in assistant responses
- **Verify:** Sending "What card is best for travel?" returns an AI response

### Phase 9 Gate Check
- [ ] All 6 product type detail screens render with real data from API
- [ ] Compare screen highlights better values correctly
- [ ] Chat screen sends a message and receives a response

---

## Phase 10 — Mobile: Agent Execution Screen

### Step 10.1 — Execution Screen Component
- [ ] Create `finance-advisor-app/components/execution/ExecutionScreen.tsx`
  - [ ] Manages 3 states: working (spinner), paused (input required), done (summary)
  - [ ] On mount: calls `POST /execute/start` with product + session_id
  - [ ] After each step: if `status === "done"` → auto-advances (calls `/execute/resume` with null value) after 500ms delay
  - [ ] If `status === "paused"` → renders correct `PausePrompt`
  - [ ] Saves progress to store after every step
  - [ ] Cancel button: calls `DELETE /execute/cancel/{sessionId}`, saves state, navigates back
  - [ ] On `complete === true` → renders `SummaryCard`

### Step 10.2 — Pause Prompt Component
- [ ] Create `finance-advisor-app/components/execution/PausePrompt.tsx`
  - [ ] Renders correct UI per `input_type`:
    - [ ] `"otp"` → 6-digit input, resend timer (60s), "Continue" button
    - [ ] `"biometric"` → fingerprint icon, "Touch sensor to continue" text, "Use PIN instead" fallback (simulated in dev)
    - [ ] `"user_choice"` → radio list of `options`, "Continue" button
    - [ ] `"clarification"` → text input or choice (depends on prompt context), "Continue" button
    - [ ] `"document_upload"` → file picker placeholder + "Upload later" option
  - [ ] On submit → calls `POST /execute/resume` with `{session_id, input_type, value}`

### Step 10.3 — Summary Card Component
- [ ] Create `finance-advisor-app/components/execution/SummaryCard.tsx`
  - [ ] Animated checkmark (✓) at top
  - [ ] Product name + reference number
  - [ ] Agent log list: ✓ prefix for auto-filled steps, ! prefix for user-provided steps
  - [ ] "What happens next" section (approval timeline, delivery info)
  - [ ] Two CTAs: "View in My Products", "Back to Discover"

### Step 10.4 — Execution Screen Route
- [ ] Create `app/(tabs)/discover/execute.tsx`
  - [ ] Receives `productId`, `productType`, `sessionId` (or auto-generates new sessionId) via route params
  - [ ] Renders `<ExecutionScreen />`
  - [ ] On cancel → navigates back to product detail with cancelled state
  - [ ] On complete → navigates to discover home with success toast

### Step 10.5 — Resume Banner Integration
- [ ] In `app/(tabs)/home.tsx` and `app/(tabs)/discover/index.tsx`:
  - [ ] Check `store.inProgressProduct` on screen focus
  - [ ] If present and not expired: show resume banner with product name + current step
  - [ ] Tapping banner → navigates to `execute.tsx` with existing sessionId (loads saved progress)
  - [ ] If expired: show "This application has expired. Start again?" banner

### Phase 10 Gate Check
- [ ] Card application flow: spinner → OTP pause → summary card with reference number
- [ ] Cancelling mid-flow: resume banner appears on Home and Discover
- [ ] Resuming from banner: execution continues from saved step_index
- [ ] Summary card agent log distinguishes ✓ (auto) from ! (user) steps

---

## Phase 11 — Profile Tab & Agent History

### Step 11.1 — Profile Home Screen
- [ ] Create `app/(tabs)/profile/index.tsx`
  - [ ] Personal info section (name, email, phone — from stored profile)
  - [ ] Quick links: Active Products, Goals, Agent History, Settings
  - [ ] Security settings section (biometric toggle, PIN change placeholder)

### Step 11.2 — Active Products Screen
- [ ] Create `app/(tabs)/profile/products.tsx`
  - [ ] Fetch `GET /orders/{userId}` — show submitted/approved orders
  - [ ] Group by product_type
  - [ ] Show status badge (Submitted / Approved / Rejected)

### Step 11.3 — Goals Tracker Screen
- [ ] Create `app/(tabs)/profile/goals.tsx`
  - [ ] Fetch `GET /goals/{userId}` — list goals with `GoalBar` progress bars
  - [ ] "Add goal" button → simple form (name, target amount, deadline)
  - [ ] Swipe-to-delete with `DELETE /goals/{goalId}` confirmation

### Step 11.4 — Agent History Screen
- [ ] Create `app/(tabs)/profile/agent-history.tsx`
  - [ ] Fetch `GET /agent-history/{userId}`
  - [ ] Each entry: product name, date, status badge, reference number
  - [ ] Expand row to show full agent_log
- **Verify:** After completing at least one execution flow, agent history shows the entry

### Phase 11 Gate Check
- [ ] All 4 Profile sub-screens render without errors
- [ ] Agent History shows completed execution entries
- [ ] Goals can be created and deleted

---

## Phase 12 — API Wiring & Polish

### Step 12.1 — Replace All Mock Data
- [ ] Audit every screen for hardcoded data
- [ ] Replace every mock with real API call
- [ ] Add loading spinners / skeleton screens for all async fetches
- [ ] Add empty states for lists with zero items

### Step 12.2 — Error States
- [ ] API error → toast notification with error message
- [ ] Network offline → offline banner across all screens
- [ ] 401 / session expired → redirect to onboarding / login screen

### Step 12.3 — Animations & Micro-interactions
- [ ] Home balance counter animates on mount (count-up from 0)
- [ ] Account pill strip smooth horizontal scroll
- [ ] Transaction list items fade-in staggered on first load
- [ ] Execution spinner: subtle 3-dot pulse animation (`Animated` API)
- [ ] Summary card checkmark: animated draw (SVG or Lottie)
- [ ] Score ring: animated fill on mount

### Step 12.4 — Local Dev Environment Verification
- [ ] Backend: `cd finance-advisor && uvicorn api:app --reload --port 8000` — runs with no errors
- [ ] Frontend: `cd finance-advisor-app && npx expo start` — app loads on Android emulator or iOS simulator
- [ ] Demo user: `user-demo-001` has seeded accounts, transactions, cards in DB
- [ ] All endpoints return data for demo user
- [ ] Execution flow for at least 2 product types (card + savings) completes end-to-end

### Phase 12 Gate Check
- [ ] No mock data remaining in any screen
- [ ] Full card application flow works end-to-end on emulator
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All 43 backend unit tests still pass: `python -m pytest tests/ -v`

---

## Summary Gate Checks — All Phases

| Phase | Gate Criterion | Status |
|-------|---------------|--------|
| 0 | Packages importable, pytest collects | ✅ PASSED |
| 1 | All 4 tool test suites pass (43 tests) | ✅ PASSED |
| 2 | All agents importable, supervisor pipeline callable | ✅ PASSED |
| 3 | CLI --help works, FastAPI importable, 43 tests pass | ✅ PASSED |
| 4 | Rich output, error handling, demo scenarios ready | ✅ PASSED |
| 5 | Bank models, extended products.json, seeded DB, all new endpoints 200 | ✅ PASSED |
| 6 | Execution agent processes steps, /execute/* endpoints work end-to-end | ✅ PASSED |
| 7 | Expo app runs, Home + Accounts tabs render with real API data | ✅ PASSED |
| 8 | Transfer 4-step flow complete, OTP works, success screen shows ref | ✅ PASSED |
| 9 | All 6 product detail types render, compare works, chat responds | [ ] |
| 10 | Card execution flow: spinner → OTP → summary card; resume banner works | [ ] |
| 11 | Profile tab, Goals CRUD, Agent History populated after execution | [ ] |
| 12 | No mock data, no TS errors, animations, full end-to-end on emulator | [ ] |

---

## Quick Start Commands (Local Dev)

```bash
# Backend
cd finance-advisor
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env            # add ANTHROPIC_API_KEY
python tools/seed_db.py         # seed demo data (Phase 5)
uvicorn api:app --reload --port 8000

# Frontend
cd finance-advisor-app
npm install
# create .env with: EXPO_PUBLIC_API_URL=http://localhost:8000
npx expo start
# Press 'a' for Android emulator, 'i' for iOS simulator

# Tests
cd finance-advisor
python -m pytest tests/ -v
```
