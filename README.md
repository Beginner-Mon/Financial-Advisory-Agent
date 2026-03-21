# Agentic Finance Advisory System — Implementation Plan

> **Local-first build guide.** Tools first, agents second. Everything runs on SQLite + Python before any microservice extraction.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Phase 0 — Project Scaffold & Local Environment](#phase-0--project-scaffold--local-environment)
- [Phase 1 — Build the 4 Tool Modules](#phase-1--build-the-4-tool-modules)
- [Phase 2 — Build Agents One at a Time](#phase-2--build-agents-one-at-a-time)
- [Phase 3 — Integration & Local Testing](#phase-3--integration--local-testing)
- [Phase 4 — Polish & Demo Readiness](#phase-4--polish--demo-readiness)
- [Future Microservice Migration Path](#future-microservice-migration-path)

---

## Architecture Overview

```
User Input (CLI / API)
        ↓
  Supervisor Agent          ← orchestrates everything
        ↓
  Profiling Agent           → User Profile Tool       (SQLite)
        ↓
  Risk & Planning Agent     → Financial Intel Tool    (Python math)
        ↓
  Recommendation Agent      → Product Catalog Tool    (JSON catalog)
        ↓
  (Optional) Verifier Agent
        ↓
  Reporting Tool            → Markdown / Rich output
        ↓
     User Output
```

### Design Principles

- **Tools first, agents second.** Every tool is pure Python with no AI — testable independently before any Claude API calls.
- **Local = SQLite + static JSON.** No Docker, no message queues, no service discovery.
- **Each `tools/` folder maps 1:1 to a future microservice.** Migration = wrap in FastAPI + change function calls to HTTP.
- **Supervisor is a Python orchestrator first.** Add LLM reasoning to the supervisor only if you need dynamic routing.

---

## Phase 0 — Project Scaffold & Local Environment

> **Duration:** ~1–2 days  
> **Goal:** Get the skeleton running before any AI code.

### Step 0.1 — Monorepo Folder Structure

Create a single local repo housing both agents and tools as separate Python packages.

```
finance-advisor/
├── agents/
│   ├── supervisor/
│   ├── profiling/
│   ├── risk_planning/
│   ├── recommendation/
│   └── verifier/           # optional
├── tools/
│   ├── user_profile/       # replaces User Profile Service
│   ├── financial_intel/    # replaces Financial Intelligence Service
│   ├── product_catalog/    # replaces Product Catalog Service
│   └── reporting/          # replaces Reporting Service
├── models/                 # shared Pydantic schemas
├── data/
│   ├── db.sqlite           # single local SQLite file
│   └── products.json       # static product catalog
├── tests/
├── .env
├── .env.example
├── requirements.txt
└── main.py                 # local entry point (CLI or FastAPI)
```

**Deliverables:**
- Folder structure committed to git
- `README.md` with setup steps
- `.env.example` file

---

### Step 0.2 — Python Environment & Dependencies

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

```
# requirements.txt
anthropic          # Claude API (agents)
fastapi            # optional lightweight HTTP layer
sqlite-utils       # easy SQLite CRUD
pydantic           # data validation between agents/tools
python-dotenv      # .env loading
rich               # pretty CLI output for debugging
uvicorn            # ASGI server (if using FastAPI)
pytest             # testing
```

**Deliverables:**
- `requirements.txt` committed
- `python -m pytest` runs without errors

---

### Step 0.3 — Shared Data Models (Pydantic)

Define canonical data models that flow between agents and tools. These act as contracts — agents produce them, tools consume them.

```python
# models/user.py
from pydantic import BaseModel

class UserProfile(BaseModel):
    user_id: str
    age: int
    income: float
    credit_score: int
    job_stability: str        # "stable" | "contract" | "self-employed"
    risk_tolerance: str       # "low" | "medium" | "high"
    goals: list[str]
    financial_holdings: dict = {}
```

```python
# models/assessment.py
from pydantic import BaseModel

class RiskAssessment(BaseModel):
    health_score: float       # 0–100
    risk_profile: str         # "conservative" | "moderate" | "aggressive"
    liquidity_ratio: float
    debt_ratio: float
    plan_steps: list[str]
```

```python
# models/recommendation.py
from pydantic import BaseModel

class ProductRecommendation(BaseModel):
    product_id: str
    name: str
    type: str
    rationale: str
    return_pct: float | None = None
```

**Deliverables:**
- `models/` package with all Pydantic schemas
- All models importable and validated

---

## Phase 1 — Build the 4 Tool Modules

> **Duration:** ~3–5 days  
> **Goal:** Pure Python functions, no AI yet. Each tool is independently testable.

### Step 1.1 — User Profile Tool

Plain Python module backed by SQLite. Stores and retrieves user profiles.

```python
# tools/user_profile/service.py
import sqlite_utils
from models.user import UserProfile

DB_PATH = "data/db.sqlite"

def save_profile(profile: UserProfile) -> str:
    db = sqlite_utils.Database(DB_PATH)
    db["profiles"].upsert(profile.model_dump(), pk="user_id")
    return profile.user_id

def get_profile(user_id: str) -> UserProfile | None:
    db = sqlite_utils.Database(DB_PATH)
    try:
        row = db["profiles"].get(user_id)
        return UserProfile(**row)
    except Exception:
        return None

def validate_and_enrich(raw: dict) -> UserProfile:
    """Fill missing fields with safe defaults before saving."""
    raw.setdefault("risk_tolerance", "medium")
    raw.setdefault("job_stability", "stable")
    raw.setdefault("financial_holdings", {})
    return UserProfile(**raw)
```

**Deliverables:**
- `save_profile`, `get_profile`, `validate_and_enrich` functions
- Unit tests using a test SQLite DB (not `data/db.sqlite`)

---

### Step 1.2 — Financial Intelligence Tool

The core computation engine. Pure Python math — no AI. This is the hardest tool to build correctly, so do it before any agents.

```python
# tools/financial_intel/engine.py
from models.user import UserProfile
from models.assessment import RiskAssessment

def compute_health_score(p: UserProfile) -> float:
    score = 50.0
    if p.credit_score >= 750: score += 25
    elif p.credit_score >= 700: score += 15
    elif p.credit_score >= 650: score += 5
    if p.income > 100_000: score += 20
    elif p.income > 60_000: score += 12
    elif p.income > 40_000: score += 5
    if p.job_stability == "stable": score += 10
    elif p.job_stability == "contract": score += 5
    return min(round(score, 1), 100.0)

def compute_risk_profile(p: UserProfile) -> str:
    score = compute_health_score(p)
    if score >= 75 and p.risk_tolerance == "high":
        return "aggressive"
    elif score >= 50 or p.risk_tolerance == "medium":
        return "moderate"
    return "conservative"

def generate_plan_steps(p: UserProfile, risk: str) -> list[str]:
    steps = []
    if p.credit_score < 680:
        steps.append("Pay down credit card balances to below 30% utilisation.")
    if "emergency_fund" in p.goals:
        months = 6 if risk == "conservative" else 3
        steps.append(f"Build a {months}-month emergency fund (~{p.income / 12 * months:,.0f}).")
    if "house" in p.goals:
        steps.append("Open a dedicated high-yield savings account for your down payment.")
    if risk == "aggressive":
        steps.append("Maximise contributions to tax-advantaged investment accounts (401k, IRA).")
    return steps

def build_financial_plan(p: UserProfile) -> RiskAssessment:
    health = compute_health_score(p)
    risk   = compute_risk_profile(p)
    steps  = generate_plan_steps(p, risk)
    return RiskAssessment(
        health_score=health,
        risk_profile=risk,
        liquidity_ratio=round(p.income * 0.2, 2),
        debt_ratio=0.30,
        plan_steps=steps
    )
```

**Deliverables:**
- `compute_health_score`, `compute_risk_profile`, `build_financial_plan` functions
- Unit tests with at least 4 sample user profiles (young/low-income, high-income, near-retirement, self-employed)
- Edge cases covered (zero income, very low credit score)

---

### Step 1.3 — Product Catalog Tool

Loads a static JSON file of financial products. Exposes filtering by eligibility and risk level.

```json
// data/products.json (example entries)
[
  {
    "id": "SAV-001",
    "name": "High-Yield Savings",
    "type": "savings",
    "min_credit": 0,
    "risk_level": "low",
    "return_pct": 4.5,
    "eligible_goals": ["emergency_fund", "house", "general"]
  },
  {
    "id": "INV-002",
    "name": "Diversified Index Fund",
    "type": "investment",
    "min_credit": 650,
    "risk_level": "moderate",
    "return_pct": 8.0,
    "eligible_goals": ["retirement", "wealth"]
  }
]
```

```python
# tools/product_catalog/service.py
import json
from models.recommendation import ProductRecommendation

CATALOG_PATH = "data/products.json"

def load_products() -> list[dict]:
    with open(CATALOG_PATH) as f:
        return json.load(f)

def map_risk(risk_profile: str) -> str:
    return {"conservative": "low", "moderate": "moderate", "aggressive": "high"}.get(risk_profile, "moderate")

def get_recommendations(risk_profile: str, goals: list[str], credit_score: int = 700) -> list[dict]:
    products = load_products()
    risk_level = map_risk(risk_profile)
    eligible = [
        p for p in products
        if p["risk_level"] == risk_level
        and p["min_credit"] <= credit_score
        and any(g in p["eligible_goals"] for g in goals)
    ]
    return eligible[:5]   # max 5 recommendations
```

**Deliverables:**
- `products.json` with at least 10–20 sample products across loans, savings, investments, insurance
- Filtering and eligibility logic
- Unit tests verifying conservative vs aggressive profiles return different results

---

### Step 1.4 — Reporting Tool

Generates a structured Markdown report. No PDF needed for MVP.

```python
# tools/reporting/generator.py
from models.user import UserProfile
from models.assessment import RiskAssessment

def generate_report(profile: UserProfile, assessment: RiskAssessment, recs: list[dict]) -> str:
    score_bar = "█" * int(assessment.health_score / 10) + "░" * (10 - int(assessment.health_score / 10))
    rec_lines = "\n".join(
        f"- **{r['name']}** ({r['type']})"
        + (f" — {r['return_pct']}% projected return" if r.get("return_pct") else "")
        for r in recs
    )
    return f"""# Financial Advisory Report

## Financial Health Score
`{score_bar}` {assessment.health_score:.0f}/100

**Risk Profile:** {assessment.risk_profile.title()}

---

## Your Goals
{chr(10).join(f"- {g.replace('_', ' ').title()}" for g in profile.goals)}

---

## Financial Plan
{chr(10).join(f"{i+1}. {s}" for i, s in enumerate(assessment.plan_steps))}

---

## Recommended Products
{rec_lines if rec_lines else "No products matched your current profile."}

---

*Report generated by Agentic Finance Advisor — for informational purposes only.*
""".strip()
```

**Deliverables:**
- `generate_report()` function
- Sample output printable to terminal via `python -c "from tools.reporting.generator import ..."`

---

## Phase 2 — Build Agents One at a Time

> **Duration:** ~5–7 days  
> **Goal:** Wire Claude to your tools using `tool_use`. One agent at a time.

### Step 2.1 — Agent Scaffolding & Tool Registry

Build the base pattern all agents share: call Claude with a system prompt and tools, handle the `tool_use` loop, return a result.

```python
# agents/base.py
import anthropic, json, os
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def run_agent(
    system: str,
    user_msg: str,
    tools: list[dict],
    tool_fn_map: dict,
    model: str = "claude-opus-4-5",
    max_tokens: int = 2048
) -> str:
    messages = [{"role": "user", "content": user_msg}]
    while True:
        resp = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            tools=tools,
            messages=messages
        )
        if resp.stop_reason == "end_turn":
            # Return the last text block
            for block in resp.content:
                if hasattr(block, "text"):
                    return block.text
            return ""

        # Handle tool calls
        tool_results = []
        for block in resp.content:
            if block.type == "tool_use":
                fn = tool_fn_map.get(block.name)
                if not fn:
                    raise ValueError(f"Unknown tool: {block.name}")
                result = fn(**block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result)
                })

        messages.append({"role": "assistant", "content": resp.content})
        messages.append({"role": "user", "content": tool_results})
```

**Deliverables:**
- `run_agent()` base function
- Works with a single mock tool call end-to-end

---

### Step 2.2 — Profiling Agent

Given raw user input, validates, enriches, and persists the profile via the User Profile Tool.

```python
# agents/profiling/agent.py
from agents.base import run_agent
from tools.user_profile.service import validate_and_enrich, save_profile
from models.user import UserProfile
import json, uuid

TOOLS = [{
    "name": "save_user_profile",
    "description": "Validate, enrich and save user financial profile to database",
    "input_schema": {
        "type": "object",
        "properties": {
            "age":            {"type": "integer", "description": "User's age in years"},
            "income":         {"type": "number",  "description": "Annual income in USD"},
            "credit_score":   {"type": "integer", "description": "Credit score 300-850"},
            "job_stability":  {"type": "string",  "enum": ["stable", "contract", "self-employed"]},
            "risk_tolerance": {"type": "string",  "enum": ["low", "medium", "high"]},
            "goals":          {"type": "array",   "items": {"type": "string"},
                               "description": "Financial goals e.g. emergency_fund, house, retirement"}
        },
        "required": ["age", "income", "credit_score", "goals"]
    }
}]

SYSTEM = """You are a financial profiling assistant.
Extract the user's financial details from their message and call save_user_profile.
If any required field is missing, make a reasonable assumption and note it in your response.
After saving, confirm what profile was created and any assumptions made."""

def _save(age, income, credit_score, goals, job_stability="stable", risk_tolerance="medium") -> dict:
    user_id = str(uuid.uuid4())[:8]
    profile = validate_and_enrich({
        "user_id": user_id, "age": age, "income": income,
        "credit_score": credit_score, "job_stability": job_stability,
        "risk_tolerance": risk_tolerance, "goals": goals
    })
    save_profile(profile)
    return profile.model_dump()

def run(user_input: str) -> dict:
    result = run_agent(SYSTEM, user_input, TOOLS, {"save_user_profile": _save})
    # The tool result (profile dict) was already saved; return it
    return result
```

**Deliverables:**
- Profiling agent callable from CLI
- Test: feed raw text, get profile saved to SQLite

---

### Step 2.3 — Risk & Planning Agent

Takes a user profile, calls the Financial Intelligence Tool, and returns a `RiskAssessment`.

```python
# agents/risk_planning/agent.py
from agents.base import run_agent
from tools.financial_intel.engine import build_financial_plan
from models.user import UserProfile
from models.assessment import RiskAssessment
import json

TOOLS = [{
    "name": "analyze_financial_health",
    "description": "Compute health score, risk profile and build a personalised financial plan",
    "input_schema": {
        "type": "object",
        "properties": {
            "user_profile_json": {
                "type": "string",
                "description": "JSON string of the user profile"
            },
            "include_scenarios": {
                "type": "boolean",
                "description": "Whether to include best/worst case scenarios",
                "default": False
            }
        },
        "required": ["user_profile_json"]
    }
}]

SYSTEM = """You are a financial risk analyst.
Use analyze_financial_health to compute the user's financial metrics.
After computing, interpret the results:
- Explain the health score in plain language
- Justify the risk classification with specific reasons
- Add qualitative context to each plan step
Always be honest about limitations."""

def _analyze(user_profile_json: str, include_scenarios: bool = False) -> dict:
    profile = UserProfile(**json.loads(user_profile_json))
    assessment = build_financial_plan(profile)
    return assessment.model_dump()

def run(profile: UserProfile) -> RiskAssessment:
    result_text = run_agent(
        SYSTEM,
        f"Analyse this user profile: {profile.model_dump_json()}",
        TOOLS,
        {"analyze_financial_health": _analyze}
    )
    # Re-fetch the last computed assessment (or parse from tool result)
    return build_financial_plan(profile)
```

**Deliverables:**
- Risk agent produces `RiskAssessment`
- Test: feed `UserProfile`, verify `health_score` and `plan_steps` make sense

---

### Step 2.4 — Recommendation Agent

Uses the `RiskAssessment` and user goals to call the Product Catalog Tool. Returns ranked recommendations with rationale.

```python
# agents/recommendation/agent.py
from agents.base import run_agent
from tools.product_catalog.service import get_recommendations
from models.assessment import RiskAssessment
import json

TOOLS = [{
    "name": "get_product_recommendations",
    "description": "Fetch eligible financial products matching the user's risk profile and goals",
    "input_schema": {
        "type": "object",
        "properties": {
            "risk_profile":  {"type": "string", "enum": ["conservative", "moderate", "aggressive"]},
            "goals":         {"type": "array",  "items": {"type": "string"}},
            "credit_score":  {"type": "integer"},
            "max_results":   {"type": "integer", "default": 5}
        },
        "required": ["risk_profile", "goals"]
    }
}]

SYSTEM = """You are a financial product advisor.
Fetch suitable products and rank them by relevance to the user's goals.
For each product, write a 1-sentence rationale tied to the user's specific situation.
Never recommend more than 5 products. Always note any eligibility requirements."""

def _fetch(risk_profile: str, goals: list, credit_score: int = 700, max_results: int = 5) -> list:
    return get_recommendations(risk_profile, goals, credit_score)[:max_results]

def run(assessment: RiskAssessment, goals: list[str], credit_score: int = 700) -> str:
    return run_agent(
        SYSTEM,
        f"Risk profile: {assessment.risk_profile}. Goals: {goals}. Credit score: {credit_score}.",
        TOOLS,
        {"get_product_recommendations": _fetch}
    )
```

**Deliverables:**
- Recommendation agent returns ranked list with rationales
- Test: conservative vs aggressive profiles return different product sets

---

### Step 2.5 — Supervisor / Orchestrator Agent

The brain. Orchestrates all agents in sequence, passes results between them, and assembles the final report.

> **Note:** For MVP, the supervisor is a plain Python orchestrator (no LLM). Add LLM reasoning only if you need dynamic routing (e.g. skipping steps for returning users).

```python
# agents/supervisor/agent.py
from agents.profiling.agent      import run as profile_user
from agents.risk_planning.agent  import run as assess_risk
from agents.recommendation.agent import run as get_recs
from tools.user_profile.service  import get_profile
from tools.reporting.generator   import generate_report
from models.user import UserProfile
import json

def run_full_pipeline(user_message: str, session_id: str = "default") -> str:
    """
    Full pipeline: profile → assess → recommend → report.
    Returns formatted Markdown report string.
    """
    print("[1/4] Profiling user...")
    profile_result = profile_user(user_message)

    # Retrieve saved profile from DB
    # (profile_user saves it; we reconstruct for downstream agents)
    profile = UserProfile(**json.loads(profile_result)) if isinstance(profile_result, str) else profile_result

    print("[2/4] Assessing risk and building plan...")
    assessment = assess_risk(profile)

    print("[3/4] Fetching recommendations...")
    recs_text = get_recs(assessment, profile.goals, profile.credit_score)

    print("[4/4] Generating report...")
    from tools.product_catalog.service import get_recommendations
    recs = get_recommendations(assessment.risk_profile, profile.goals, profile.credit_score)
    return generate_report(profile, assessment, recs)
```

**Deliverables:**
- `main.py` runs full pipeline end-to-end
- CLI: `python main.py "I want to save for a house in 5 years"`

---

## Phase 3 — Integration & Local Testing

> **Duration:** ~2–3 days  
> **Goal:** Make all agents work together correctly.

### Step 3.1 — End-to-End CLI Test

```python
# main.py
import sys
from agents.supervisor.agent import run_full_pipeline

try:
    from rich import print as rprint
    from rich.markdown import Markdown
    USE_RICH = True
except ImportError:
    USE_RICH = False

if __name__ == "__main__":
    goal = " ".join(sys.argv[1:]) or "I want to save for a house in 5 years"
    print(f"\nRunning pipeline for: '{goal}'\n{'─'*50}")
    report = run_full_pipeline(goal)
    if USE_RICH:
        rprint(Markdown(report))
    else:
        print(report)
```

```bash
# Test runs:
python main.py "I'm 28, earn 60k, credit score 680, want to buy a house"
python main.py "I'm 45, income 120k, credit 780, planning retirement at 62"
```

**Deliverables:**
- Full pipeline runs without errors
- Output is readable, makes sense, no hallucinated numbers

---

### Step 3.2 — Optional Verifier Agent

A lightweight cross-check pass on the assembled report.

```python
# agents/verifier/agent.py
from agents.base import run_agent

SYSTEM = """You are a financial compliance reviewer.
Review the advisory report for:
1. Risk profile ↔ product consistency (conservative profile should not recommend high-risk funds)
2. Health score ↔ plan feasibility (a score of 30 should not suggest aggressive investing)
3. Missing disclosures or unrealistic return projections
4. Any logical contradictions in the financial plan

Return APPROVED if everything is consistent, or list specific issues to fix."""

def verify(report: str) -> str:
    return run_agent(
        SYSTEM,
        f"Please review this financial advisory report:\n\n{report}",
        tools=[],
        tool_fn_map={}
    )
```

```bash
# Enable with flag:
python main.py "..." --verify
```

**Deliverables:**
- Verifier catches intentionally broken test inputs
- `--verify` flag in CLI

---

### Step 3.3 — Conversation Memory (Multi-Turn)

Store message history so the user can refine their plan without re-entering all details.

```python
# tools/user_profile/memory.py
import sqlite_utils, json
from datetime import datetime

DB_PATH = "data/db.sqlite"

def save_session(session_id: str, messages: list):
    db = sqlite_utils.Database(DB_PATH)
    db["sessions"].upsert({
        "session_id": session_id,
        "messages": json.dumps(messages),
        "updated_at": datetime.now().isoformat()
    }, pk="session_id")

def load_session(session_id: str) -> list:
    db = sqlite_utils.Database(DB_PATH)
    try:
        row = db["sessions"].get(session_id)
        return json.loads(row["messages"])
    except Exception:
        return []
```

**Deliverables:**
- Session persists across CLI invocations using `--session` flag
- User can say "change my goal to retirement" without re-profiling from scratch

---

### Step 3.4 — Optional FastAPI Layer

Expose the pipeline as a local HTTP API if you want to build a frontend or test with Postman.

```python
# api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from agents.supervisor.agent import run_full_pipeline

app = FastAPI(title="Finance Advisor API", version="0.1.0")

class Query(BaseModel):
    message: str
    session_id: str = "default"

class Report(BaseModel):
    report: str
    session_id: str

@app.post("/advise", response_model=Report)
def advise(q: Query):
    try:
        report = run_full_pipeline(q.message, q.session_id)
        return Report(report=report, session_id=q.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
```

```bash
uvicorn api:app --reload
# Test: curl -X POST http://localhost:8000/advise -H "Content-Type: application/json" \
#       -d '{"message": "I earn 50k and want to retire at 60"}'
```

**Deliverables:**
- `POST /advise` returns report JSON
- Works with curl or Postman locally

---

## Phase 4 — Polish & Demo Readiness

> **Duration:** ~1–2 days  
> **Goal:** Make it presentable and demo-stable.

### Step 4.1 — Rich Report Formatting

```python
# Enhance main.py with Rich console output
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress

console = Console()

def print_score(score: float):
    color = "green" if score >= 70 else "yellow" if score >= 50 else "red"
    bar = "█" * int(score / 10) + "░" * (10 - int(score / 10))
    console.print(f"\n[bold]Financial Health Score[/bold]")
    console.print(f"[{color}]{bar}[/{color}] [{color}]{score:.0f}/100[/{color}]\n")
```

**Deliverables:**
- Rich console output with colour-coded risk level (green/yellow/red)
- Health score displayed as a progress bar

---

### Step 4.2 — Error Handling & Graceful Fallbacks

```python
# Wrap all agent calls in try/except
from models.assessment import RiskAssessment

def safe_assess_risk(profile) -> RiskAssessment:
    try:
        return assess_risk(profile)
    except Exception as e:
        print(f"[Warning] Risk assessment failed: {e}. Using default values.")
        return RiskAssessment(
            health_score=50.0,
            risk_profile="moderate",
            liquidity_ratio=0.0,
            debt_ratio=0.3,
            plan_steps=["Unable to compute detailed plan. Please review your inputs."]
        )
```

**Deliverables:**
- No uncaught exceptions in demo flow
- All errors surface as human-readable messages (not stack traces)

---

### Step 4.3 — Demo Scenarios

Prepare canned test inputs covering different user archetypes. Run all of them before any demo.

```python
# tests/demo_scenarios.py
import subprocess

SCENARIOS = [
    "I'm 24, I earn $35k/year, my credit score is 620. I want to build an emergency fund.",
    "I'm 42, income $120k, credit score 780. I want to retire at 60 with $2 million saved.",
    "I'm 30, self-employed, income varies $40k-$80k. I want to buy a house in 3 years.",
    "I'm 55, income $90k, credit score 700. I have $200k in savings. Planning for retirement.",
]

if __name__ == "__main__":
    for i, scenario in enumerate(SCENARIOS, 1):
        print(f"\n{'='*60}")
        print(f"SCENARIO {i}: {scenario[:60]}...")
        print('='*60)
        subprocess.run(["python", "main.py", scenario])
```

```bash
python tests/demo_scenarios.py
```

**Deliverables:**
- All 4 scenarios produce sensible, distinct reports
- No hallucinated products or nonsensical health scores

---

## Future Microservice Migration Path

When ready to scale, each `tools/` module becomes its own FastAPI service. The only change in agent code is swapping local function calls for HTTP calls.

```
# Local (now)                        Future (microservice)
tools/user_profile/    ──────────→  User Profile Service     (port 8001)
tools/financial_intel/ ──────────→  Financial Intel Service  (port 8002)
tools/product_catalog/ ──────────→  Product Catalog Service  (port 8003)
tools/reporting/       ──────────→  Reporting Service        (port 8004)
```

```python
# Migration pattern: swap function for HTTP call in tool_fn_map
# Before (local):
tool_fn_map = {"save_user_profile": validate_and_save}

# After (microservice):
import httpx
tool_fn_map = {
    "save_user_profile": lambda **kw: httpx.post(
        "http://user-profile-service:8001/profile", json=kw
    ).json()
}
```

The agent code itself does not change — only the `tool_fn_map` dict is updated.

---

## Build Order Summary

```
Phase 0: Scaffold           → models/ + folder structure + requirements.txt
Phase 1: Tools              → user_profile → financial_intel → product_catalog → reporting
Phase 2: Agents             → base.py → profiling → risk_planning → recommendation → supervisor
Phase 3: Integration        → end-to-end CLI → verifier → memory → (optional) FastAPI
Phase 4: Polish             → formatting → error handling → demo scenarios
```

Always have a working system at each step. Never break the pipeline to add a new feature.

---

*Built for local-first development. Designed to scale to microservices.*