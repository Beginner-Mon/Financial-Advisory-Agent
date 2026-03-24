# Agent Backend Adjustment Plan

## 🎯 Core Intent Detection
- Before doing anything, agent checks: **is the user trying to build a financial profile?**
- If yes → trigger the step-by-step profiling flow
- If no → respond normally, no extra logic, no agent calls

---

## 🪜 Step-by-Step Profile Collection (not all-at-once)
- Agent asks **one logical group of questions at a time** (e.g. income first, then goals, then risk)
- Each step shows:
  - A short question or prompt
  - A **text input area** for the user to type
  - A **"Skip"** button to move past that step
- Agent remembers answers across steps within the session
- When the user skips or gives partial info, agent continues without blocking

---

## 🧠 "Enough Info" Threshold
- Agent internally tracks what it has collected so far
- Once it has **enough to make a reasonable recommendation**, it proceeds to call the backend / product engine
- It does **not** wait for all fields to be filled
- If profile is incomplete → still returns recommendations, but **adds a note** like:
  > *"This recommendation is based on partial information. Update your profile for more accurate suggestions."*

---

## ⏳ Progress Indicator During Processing
- While the agent is working, it shows live status steps, e.g.:
  - *"Analyzing your financial goals..."*
  - *"Matching savings products..."*
  - *"Calculating loan eligibility..."*
  - *"Finalizing recommendations..."*
- Each step ticks off as the agent completes it

---

## 💡 AI-Powered Value Recommendations (the key differentiator)
Unlike a traditional form, the agent **pre-fills or suggests values** based on the profile:

| Product | What AI Recommends |
|---|---|
| **Savings** | Target amount, monthly deposit, timeline |
| **Loans** | Loan amount, tenure, repayment estimate |
| **Insurance** | Coverage type, suggested sum insured |
| **Investments** | Risk level, allocation split, starting amount |
| **Cards** | Card tier, credit limit suggestion |
| **Promotions** | Relevant promos matched to spending behavior |

- These are presented as **pre-filled suggestions the user can edit**, not hard values
- This makes the AI feel genuinely helpful vs a dumb form

---

## ✅ Product Recommendation Logic
- Agent maps the collected profile to the **right products** (not just any products)
- Matching factors: income range, goal type, risk appetite, time horizon, existing products
- Products that **don't fit the profile are filtered out** or ranked lower
- Auto-purchase / auto-select flow is preserved — agent can proceed to initiate on the user's behalf

---

## 📝 Incomplete Profile Note (when applicable)
- If recommendations are made with partial data, append a consistent note:
  > *"⚠️ Your profile is incomplete. These suggestions may not fully reflect your situation. Complete your profile for better results."*
