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
  - [x] Test save + retrieve round-trip
  - [x] Test validate_and_enrich fills defaults
  - [x] Test missing required fields raise ValidationError
  - [x] Use temp SQLite DB (pytest `tmp_path` fixture)
- **✅ Verify:** `python -m pytest tests/test_user_profile.py -v` — all pass ✅ PASSED

### Step 1.2 — Financial Intelligence Tool
- [x] Create `tools/financial_intel/engine.py`
  - [x] `compute_health_score(profile)` → float 0–100
  - [x] `compute_risk_profile(profile)` → "conservative" | "moderate" | "aggressive"
  - [x] `generate_plan_steps(profile, risk)` → list[str]
  - [x] `build_financial_plan(profile)` → `RiskAssessment`
- [x] Create `tests/test_financial_intel.py`
  - [x] Test 4+ user archetypes: young/low-income, high-income, near-retirement, self-employed
  - [x] Test edge cases: zero income, min credit score (300), max credit score (850)
  - [x] Test health_score always in [0, 100]
  - [x] Test risk_profile consistency with score + tolerance
- **✅ Verify:** `python -m pytest tests/test_financial_intel.py -v` — all pass ✅ PASSED

### Step 1.3 — Product Catalog Tool
- [x] Create `data/products.json` with 15–20 products
  - [x] Categories: savings, investment, loan, insurance
  - [x] Risk levels: low, moderate, high
  - [x] Various credit score thresholds and eligible goals
- [x] Create `tools/product_catalog/service.py`
  - [x] `load_products(catalog_path=None)` — load JSON with caching
  - [x] `map_risk(risk_profile)` — map assessment risk to catalog risk
  - [x] `get_recommendations(risk_profile, goals, credit_score)` → list[dict]
- [x] Create `tests/test_product_catalog.py`
  - [x] Test conservative vs aggressive return different products
  - [x] Test credit score filtering excludes ineligible products
  - [x] Test goal matching works correctly
  - [x] Test max 5 results cap
- **✅ Verify:** `python -m pytest tests/test_product_catalog.py -v` — all pass ✅ PASSED

### Step 1.4 — Reporting Tool
- [x] Create `tools/reporting/generator.py`
  - [x] `generate_report(profile, assessment, recs)` → markdown string
  - [x] Include: health score bar, risk profile, goals, plan steps, product recommendations
- [x] Create `tests/test_reporting.py`
  - [x] Test report contains all expected sections
  - [x] Test report with empty recommendations
  - [x] Test report with empty plan steps
- **✅ Verify:** `python -m pytest tests/test_reporting.py -v` — all pass ✅ PASSED

### Phase 1 Gate Check
- [x] **All 4 tool test suites pass:** `python -m pytest tests/ -v` — **43 passed** ✅
- [x] No AI/API calls needed — everything is pure Python

---

## Phase 2 — Build Agents One at a Time

### Step 2.1 — Agent Base Scaffolding
- [x] Create `agents/base.py`
  - [x] `run_agent(system, user_msg, tools, tool_fn_map, model, max_tokens)` → str
  - [x] Tool-use loop with `max_iterations=10` guard
  - [x] Retry logic with exponential backoff for API rate limits
  - [x] Structured error handling for `anthropic.APIError`
- **✅ Verify:** Base function importable, handles mock tool call ✅ PASSED

### Step 2.2 — Profiling Agent
- [x] Create `agents/profiling/agent.py`
  - [x] Define tool schema for `save_user_profile`
  - [x] System prompt for financial profiling
  - [x] `run(user_input: str)` → extracts profile from text, saves to DB
- **✅ Verify:** Importable, tool schema defined ✅ PASSED

### Step 2.3 — Risk & Planning Agent
- [x] Create `agents/risk_planning/agent.py`
  - [x] Define tool schema for `analyze_financial_health`
  - [x] System prompt for risk analysis
  - [x] `run(profile: UserProfile)` → `RiskAssessment`
- **✅ Verify:** Importable, wired to financial_intel engine ✅ PASSED

### Step 2.4 — Recommendation Agent
- [x] Create `agents/recommendation/agent.py`
  - [x] Define tool schema for `get_product_recommendations`
  - [x] System prompt for product advising
  - [x] `run(assessment, goals, credit_score)` → recommendation text
- **✅ Verify:** Importable, wired to product_catalog ✅ PASSED

### Step 2.5 — Supervisor / Orchestrator
- [x] Create `agents/supervisor/agent.py`
  - [x] `run_full_pipeline(user_message, session_id)` → markdown report
  - [x] Sequential: profile → assess → recommend → report
  - [x] Logging at each step
- **✅ Verify:** Importable, pipeline function callable ✅ PASSED

---

## Phase 3 — Integration & Local Testing

### Step 3.1 — End-to-End CLI
- [x] Create `main.py` entry point
  - [x] Accept user message as CLI argument
  - [x] Print formatted report to terminal
  - [x] Add `--session` flag for multi-turn
  - [x] Add `--json` flag for machine-readable output
  - [x] Add `--help` with usage examples
- **✅ Verify:** `python main.py --help` displays usage ✅ PASSED

### Step 3.2 — Verifier Agent (Optional)
- [x] Create `agents/verifier/agent.py`
  - [x] Cross-check risk profile ↔ product consistency
  - [x] Validate health score ↔ plan feasibility
  - [x] Return APPROVED or list issues
- [x] Add `--verify` flag to `main.py`
- **✅ Verify:** Importable, wired to CLI --verify flag ✅ PASSED

### Step 3.3 — Conversation Memory
- [x] Create `tools/user_profile/memory.py`
  - [x] `save_session(session_id, messages)` — persist to SQLite
  - [x] `load_session(session_id)` → list of messages
- **✅ Verify:** Importable, save/load functions callable ✅ PASSED

### Step 3.4 — FastAPI Layer (Optional)
- [x] Create `api.py`
  - [x] `POST /advise` — accepts `{message, session_id}`, returns `{report, session_id}`
  - [x] `GET /health` — checks DB connectivity
  - [x] CORS middleware for frontend dev
  - [x] Global exception handler
- **✅ Verify:** Importable, endpoints defined ✅ PASSED

### Phase 3 Gate Check
- [x] All imports verified for all agents and tools
- [x] All 43 unit tests still pass: `python -m pytest tests/ -v` ✅

---

## Phase 4 — Polish & Demo Readiness

### Step 4.1 — Rich Console Output
- [x] Colour-coded Rich Panel wrapping for report
- [x] Rich progress spinner during pipeline execution
- **✅ Verify:** Rich formatting in main.py ✅ PASSED

### Step 4.2 — Error Handling & Fallbacks
- [x] Wrap pipeline call in try/except
- [x] Missing API key → human-readable error message
- [x] No uncaught exceptions in CLI flow
- **✅ Verify:** Missing key message shown ✅ PASSED

### Step 4.3 — Demo Scenarios
- [x] Prepare 4 canned test inputs covering different archetypes:
  1. Young, low-income, emergency fund
  2. Mid-career, high-income, retirement
  3. Self-employed, variable income, house
  4. Near-retirement, moderate income, wealth preservation
- [x] Script at `tests/demo_scenarios.py` with sanity checks
- **✅ Verify:** Script importable, scenarios defined ✅ PASSED

### Step 4.4 — Final Documentation
- [x] Add `--help` to CLI
- **✅ Verify:** `python main.py --help` works ✅ PASSED

---

## Summary Gate Checks

| Phase | Gate Criterion | Status |
|-------|---------------|--------|
| 0 | Packages importable, pytest collects | ✅ PASSED |
| 1 | All 4 tool test suites pass (43 tests) | ✅ PASSED |
| 2 | All agents importable, supervisor pipeline callable | ✅ PASSED |
| 3 | CLI --help works, FastAPI importable, 43 tests pass | ✅ PASSED |
| 4 | Rich output, error handling, demo scenarios ready | ✅ PASSED |
