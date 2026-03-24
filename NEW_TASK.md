# Implementation Plan: App Layout Refactor & Traditional Flows

## Overarching Goal
Overhaul the mobile app layout to make AI assistance more deeply integrated into the Home screen, while providing "Traditional" (non-AI, manual step-by-step) application flows for all financial products to highlight the contrast between traditional banking and AI-guided banking.

---

## 1. Bottom Tab Navigation
*   **Rename & Re-icon:** Change the `Discover` tab to `AI Guide`. Change the icon from a compass to sparkles/stars (e.g. `sparkles` or `star-outline` from Ionicons). 

## 2. Home Screen (`home.tsx`) Overhaul
*   **Header Section:** 
    *   Remove the center-aligned total balance.
    *   Add a left-aligned greeting: "Good morning, [User Name]" with a user Avatar.
    *   Place the Total Balance below the greeting. **Hidden by default** (displaying `****`). Add an eye/slash-eye icon toggle to show/hide the exact amount.
    *   Remove the `+2.4 this month` tag.
*   **Remove Old Components:**
    *   Remove "Your Accounts" list from the Home screen.
    *   Remove "Recent Transactions" from the Home screen.
*   **Add "Browse Products":**
    *   Move the product categories grid (Cards, Savings, Loans, etc.) from Discover to the Home screen.
    *   Move "Current Promos" to sit directly under Browse Products.
*   **Inline AI Agent Chat:**
    *   Remove the small "Ask the AI Advisor anything" banner.
    *   Embed a functional chatbox directly into the Home screen. Start with the greeting: "Hi, how can I help you today?".
    *   Add clickable preset suggestion chips above the chat input: e.g., "Plan savings", "Give current promos".

## 3. Product Discovery & Traditional Purchase Flows
*   **Dual Application Paths:** When a user taps on a product in the Browse section, they will have two choices to purchase/open it:
    1.  **AI Assisted (Existing):** The agent autonomously fills it out.
    2.  **Traditional Method (New):** A manual, step-by-step wizard (No AI interaction).
*   **Post-Purchase Display:** Once purchased traditionally, the product will surface in the user's `Accounts` tab as an actively held product/summary.

## 4. Accounts Screen: Savings Breakdown
*   **Multiple Instances:** Users can open the same Savings product multiple times with different initial deposits.
*   **Accounts UI:** Update the Savings section in the Accounts tab to list every specific savings *transaction/instance* the user holds, rather than just a generic "Savings Account".
*   **Clean UI:** Remove unnecessary mock components from the current accounts screen to strictly highlight the user's active Checking and specific Savings targets.

## 5. Transfer Screen Restrictions
*   **Checking Only:** Modify the Transfer logic and UI dropdowns to entirely exclude Savings accounts from the "From" field. Users can only transfer money *out* of Checking accounts.

---

## Testing & Verification Checklist
- [ ] Tab Navigation displays "AI Guide" with a star/sparkle icon.
- [ ] Home Screen displays left-aligned greeting and avatar.
- [ ] Balance is hidden by default and toggles correctly with the eye icon.
- [ ] Home Screen contains Browse Products and Promos.
- [ ] Home Screen contains embedded conversational AI Chat with preset chips.
- [ ] "Your Accounts" and "Recent Transactions" are removed from Home.
- [ ] Product Details screen offers a clear "Traditional Apply" button.
- [ ] Traditional Apply triggers a step-by-step form wizard (No AI).
- [ ] Completed traditional applications appear in the user's account summary.
- [ ] Accounts tab accurately tracks multiple independent instances of Savings products.
- [ ] Transfer screen absolutely prevents selecting a Savings account as the source of funds.
