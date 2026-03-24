# Agentic Finance System — Implementation Q&A

## Local tech stack / framework
**What did you actually use to build the agents?**

- **Core backend:** Python 3.11 + FastAPI
- **Agent implementation style:** **custom Python agent framework** (no LangGraph/CrewAI/AutoGen/LangChain)
- **Orchestration:** deterministic Python supervisor pipeline (`profile -> assess -> recommend -> report`)
- **Agent runtime:** custom `run_agent()` with Gemini function-calling + tool loop
- **Data layer:** SQLite (`sqlite-utils`) + JSON catalog file
- **Validation/models:** Pydantic

In short: this is **LangChain-free custom orchestration** with tool-calling, implemented directly in Python.

---

## LLM used
**Which model / backend are you running locally?**

- **Backend:** Google Gemini API via `google-generativeai`
- **Configured local model:** `gemini-2.5-flash` (from `.env`)
- **Code default fallback:** `gemini-2.0-flash` (if env var is not set)

---

## Agents actually implemented
**List the agents you built (even if merged).**

Implemented agent modules:

1. **Supervisor Agent** (`agents/supervisor/agent.py`) — orchestrates the full pipeline
2. **Profiling Agent** (`agents/profiling/agent.py`) — extracts and saves user profile
3. **Risk & Planning Agent** (`agents/risk_planning/agent.py`) — computes health/risk + plan
4. **Recommendation Agent** (`agents/recommendation/agent.py`) — product matching
5. **Verifier Agent** (`agents/verifier/agent.py`) — consistency/compliance checks
6. **Execution Agent** (`agents/execution/agent.py`) — step-by-step product application flow

So this implementation has **6 agents total** (not merged into a single agent).

---

## UI
**What interface did you use?**

- **Primary app UI:** Expo + React Native (`finance-advisor-app`)
- **Backend interface:** FastAPI REST endpoints (`/advise`, `/advise/structured`, etc.)
- **Also available:** CLI entry point (`finance-advisor/main.py`) for local terminal usage

So practically: **FastAPI backend + mobile UI (Expo/React Native) + optional CLI**.

---

## Profile data handling
**How does the system store/receive the user profile?**

- User profile is extracted from natural language by the Profiling Agent
- Data is validated/enriched via `validate_and_enrich()`
- Profile is persisted to **SQLite** table `profiles` (file: `data/db.sqlite`)
- Complex fields (`goals`, `financial_holdings`) are serialized as JSON strings in DB
- Profile can later be read back via tool functions (not only in-memory)

So storage is **persistent SQLite**, not just temporary in-memory dicts.

---

## Product catalog
**How many products are in your catalog and how are they stored?**

- **Catalog size:** **55 products**
- **Storage format:** JSON file at `finance-advisor/data/products.json`
- **Access pattern:** loaded by Product Catalog tool and cached (`lru_cache`) in memory

---

## Key implementation highlights (optional but helpful)

- **Perceive–reason–plan–act structure:** implemented as a **deterministic multi-agent pipeline**, not a cyclic graph engine (no LangGraph state machine)
- **Prompting approach:** each agent has a focused system prompt + explicit tool schema
- **Output/tool parsing:** robust conversion of Gemini/protobuf tool args/responses in `agents/base.py`
- **Retry logic:** exponential backoff for rate/quota errors in agent runtime
- **Safety guards:** `max_iterations` limit in tool-use loop to avoid infinite cycles
- **Chaining/memory:** session-based chaining via `session_id` + persistent state in SQLite tables
- **Execution flow:** human-in-the-loop pause/resume for steps like OTP/biometric/consent
