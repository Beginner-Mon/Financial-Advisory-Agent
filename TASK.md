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
- [ ] Create `agents/base.py`
  - [ ] `run_agent(system, user_msg, tools, tool_fn_map, model, max_tokens)` → str
  - [ ] Tool-use loop with `max_iterations=10` guard
  - [ ] Retry logic with exponential backoff for API rate limits
  - [ ] Structured error handling for `anthropic.APIError`
- **✅ Verify:** Base function importable, handles mock tool call

### Step 2.2 — Profiling Agent
- [ ] Create `agents/profiling/agent.py`
  - [ ] Define tool schema for `save_user_profile`
  - [ ] System prompt for financial profiling
  - [ ] `run(user_input: str)` → extracts profile from text, saves to DB
- **✅ Verify:** Feed raw text, profile saved to SQLite, retrievable via `get_profile()`

### Step 2.3 — Risk & Planning Agent
- [ ] Create `agents/risk_planning/agent.py`
  - [ ] Define tool schema for `analyze_financial_health`
  - [ ] System prompt for risk analysis
  - [ ] `run(profile: UserProfile)` → `RiskAssessment`
- **✅ Verify:** Feed `UserProfile`, get valid `RiskAssessment` with sensible scores

### Step 2.4 — Recommendation Agent
- [ ] Create `agents/recommendation/agent.py`
  - [ ] Define tool schema for `get_product_recommendations`
  - [ ] System prompt for product advising
  - [ ] `run(assessment, goals, credit_score)` → recommendation text
- **✅ Verify:** Conservative vs aggressive profiles yield different product sets

### Step 2.5 — Supervisor / Orchestrator
- [ ] Create `agents/supervisor/agent.py`
  - [ ] `run_full_pipeline(user_message, session_id)` → markdown report
  - [ ] Sequential: profile → assess → recommend → report
  - [ ] Logging at each step
- **✅ Verify:** `python main.py "I want to save for a house"` produces full report

---

## Phase 3 — Integration & Local Testing

### Step 3.1 — End-to-End CLI
- [ ] Create `main.py` entry point
  - [ ] Accept user message as CLI argument
  - [ ] Print formatted report to terminal
  - [ ] Add `--session` flag for multi-turn
- [ ] Run with multiple test inputs — no crashes
- **✅ Verify:** `python main.py "I'm 28, earn 60k, credit 680, want a house"` → full report

### Step 3.2 — Verifier Agent (Optional)
- [ ] Create `agents/verifier/agent.py`
  - [ ] Cross-check risk profile ↔ product consistency
  - [ ] Validate health score ↔ plan feasibility
  - [ ] Return APPROVED or list issues
- [ ] Add `--verify` flag to `main.py`
- **✅ Verify:** `python main.py "..." --verify` runs verifier after report

### Step 3.3 — Conversation Memory
- [ ] Create `tools/user_profile/memory.py`
  - [ ] `save_session(session_id, messages)` — persist to SQLite
  - [ ] `load_session(session_id)` → list of messages
- [ ] Wire into supervisor for multi-turn conversations
- **✅ Verify:** Run twice with same `--session`, second run has context from first

### Step 3.4 — FastAPI Layer (Optional)
- [ ] Create `api.py`
  - [ ] `POST /advise` — accepts `{message, session_id}`, returns `{report, session_id}`
  - [ ] `GET /health` — checks DB connectivity
  - [ ] CORS middleware for frontend dev
  - [ ] Global exception handler
- **✅ Verify:** `curl -X POST http://localhost:8000/advise -H "Content-Type: application/json" -d '{"message": "..."}'` → JSON report

### Phase 3 Gate Check
- [ ] Full pipeline works end-to-end via CLI
- [ ] All test suites still pass: `python -m pytest tests/ -v`

---

## Phase 4 — Polish & Demo Readiness

### Step 4.1 — Rich Console Output
- [ ] Colour-coded health score bar (green ≥ 70, yellow ≥ 50, red < 50)
- [ ] `Panel` wrapping for report sections
- [ ] `Progress` spinner during agent calls
- **✅ Verify:** Visual inspection — output looks professional

### Step 4.2 — Error Handling & Fallbacks
- [ ] Wrap every agent call in try/except
- [ ] `safe_assess_risk()` returns default `RiskAssessment` on failure
- [ ] No uncaught exceptions in any demo scenario
- [ ] Human-readable error messages (not stack traces)
- **✅ Verify:** Kill API key → system gracefully falls back, no crash

### Step 4.3 — Demo Scenarios
- [ ] Prepare 4 canned test inputs covering different archetypes:
  1. Young, low-income, emergency fund
  2. Mid-career, high-income, retirement
  3. Self-employed, variable income, house
  4. Near-retirement, moderate income, wealth preservation
- [ ] All 4 produce distinct, sensible reports
- [ ] No hallucinated products or nonsensical health scores
- **✅ Verify:** `python tests/demo_scenarios.py` — all 4 pass without errors

### Step 4.4 — Final Documentation
- [ ] Update `README.md` with setup & run instructions
- [ ] Add `--help` to CLI
- [ ] Document all API endpoints (if FastAPI enabled)
- **✅ Verify:** A new developer can clone, install, and run in < 5 minutes

---

## Summary Gate Checks

| Phase | Gate Criterion | Command |
|-------|---------------|---------|
| 0 | Packages importable, pytest collects | `python -m pytest --collect-only` |
| 1 | All 4 tool test suites pass | `python -m pytest tests/test_*.py -v` |
| 2 | Each agent callable, supervisor runs pipeline | `python main.py "test input"` |
| 3 | Full E2E works, FastAPI responds | `curl POST /advise` |
| 4 | 4 demo scenarios pass, Rich output works | `python tests/demo_scenarios.py` |
