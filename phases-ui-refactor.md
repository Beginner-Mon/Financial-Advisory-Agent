# App Layout Refactor & Traditional Flows — Implementation Plan

## Overarching Goal
Overhaul the mobile app layout to make AI assistance more deeply integrated into the Home screen, while providing "Traditional" (non-AI, manual step-by-step) application flows for all financial products to highlight the contrast between traditional banking and AI-guided banking.

---

## Table of Contents

- [Overview — What Changes, What Stays](#overview--what-changes-what-stays)
- [Home Screen — Full Layout Spec](#home-screen--full-layout-spec)
- [AI Chat on Home — Behaviour & Routing](#ai-chat-on-home--behaviour--routing)
- [Traditional Flows — Step-by-Step Wizard](#traditional-flows--step-by-step-wizard)
- [Accounts Tab — Savings Breakdown & Cleanup](#accounts-tab--savings-breakdown--cleanup)
- [Transfer Screen — Checking-Only Restriction](#transfer-screen--checking-only-restriction)
- [File Structure & Build Order](#file-structure--build-order)
- [Testing & Verification Checklist](#testing--verification-checklist)

---

## Overview — What Changes, What Stays

### Navigation changes

| Before | After |
|---|---|
| "Discover" tab | "AI Guide" tab |
| Compass icon | Sparkles / stars icon (`Ionicons: sparkles`) |
| Product browse lives in Discover | Product browse moves to Home |
| Promos live in Discover | Promos move to Home |
| AI chat bar at bottom of Discover | AI Guide tab = deep advisor flows only |

### Home screen changes

**Removed from Home:**
- Center-aligned total balance
- `+$X.XX this month` trend tag
- "Your Accounts" list
- "Recent Transactions" list
- Small AI banner/strip at bottom

**Added to Home:**
- Left-aligned greeting with user avatar
- Hidden balance (`****`) with eye icon toggle
- Browse Products grid (6 categories, 2×3)
- Current Promotions horizontal scroll strip
- Embedded AI Guide section with preset suggestion chips (chips only — no text input)

### Product purchase — new dual path

| Path | Description |
|---|---|
| Path A — AI Assisted (existing) | Agent fills all fields, pauses for OTP/biometric, delivers summary |
| Path B — Traditional (new) | Step-by-step wizard, fields pre-filled from profile, user confirms every field manually |
| Entry point | Product detail screen shows two CTAs: "AI Guide" and "Apply manually" |
| Post-purchase | Both paths surface the product in Accounts tab as an active holding |

### Accounts tab changes

| Before | After |
|---|---|
| Generic "Savings Account" single row | Each savings instance listed separately with nickname |
| Mock/placeholder components present | All mock components removed |
| Aggregated savings balance | Checking + individual named savings targets only |

### Transfer tab changes

| Before | After |
|---|---|
| "From" dropdown includes all accounts including savings | "From" dropdown shows checking accounts only — savings excluded entirely |

### Screens affected

| File | Change type |
|---|---|
| `app/(tabs)/home.tsx` | Full overhaul |
| `app/(tabs)/ai-guide/` | Renamed from `discover/`, icon changed |
| `app/(tabs)/accounts/index.tsx` | Savings breakdown + remove mock data |
| `app/(tabs)/transfer/index.tsx` | Checking-only restriction on "From" field |
| `app/(tabs)/ai-guide/product/[id].tsx` | Add dual CTA (AI Guide vs Traditional) |
| `app/traditional/[product_id].tsx` | **New** — step-by-step wizard per product type |
| `components/HomeChat/index.tsx` | **New** — chips-only AI section (no text input) |
| `components/HomeChat/ProductChip.tsx` | **New** — inline product card in chat |
| `components/traditional/WizardShell.tsx` | **New** — shared step wizard wrapper |
| `constants/chatChips.ts` | **New** — preset chip definitions |

---

## Home Screen — Full Layout Spec

### Full scroll order (top to bottom)

```
1. Header             — avatar, greeting, hidden balance + eye toggle, notification bell
2. Quick actions      — Transfer, Pay, Top-up, Cards, More
~  Resume banner      — conditional, only if in-progress agent session exists
3. Browse Products    — 2×3 category grid with AI Pick dot badges
4. Current promotions — horizontal scroll strip
5. AI Guide section   — greeting bubble, preset chips only (no text input)
```

---

### 1.1 — Header: greeting, avatar, balance toggle

Left-aligned greeting with user avatar. Balance hidden by default — user taps the eye icon to reveal. No trend tag.

```
┌─────────────────────────────────┐
│                              🔔 │  ← notification bell top-right
│ ○  Good morning,                │  ← avatar circle (initials), left-aligned
│    Alex Johnson                 │
│                                 │
│ Total balance                   │  ← muted label
│ $ * * * * . * *  👁             │  ← hidden by default
│                                 │  ← eye tapped → shows $24,830.00
└─────────────────────────────────┘
```

```typescript
// components/bank/BalanceHeader.tsx
const [visible, setVisible] = useState(false)

// Avatar: initials from profile.full_name, navy background, white text
// Balance: visible ? profile.total_balance.toLocaleString() : "* * * * . * *"
// Eye icon: Ionicons "eye-outline" / "eye-off-outline"
// Toggle preference persisted in AsyncStorage key "balance_visible"
// Hidden on every cold app launch — not just first launch
```

**Rules:**
- Balance hidden on every cold app launch regardless of previous session
- Toggle preference saved to `AsyncStorage` key `"balance_visible"`
- Notification bell navigates to `/notifications`
- Avatar tap navigates to Profile tab

---

### 1.2 — Quick actions strip

```
┌─────────────────────────────────┐
│ [⇄ Transfer] [💳 Pay] [↑ Top-up]│
│ [🔒 Cards]   [··· More]         │
└─────────────────────────────────┘

Navigation targets:
  Transfer  → app/(tabs)/transfer/
  Pay       → app/(tabs)/transfer/pay-bills
  Top-up    → app/(tabs)/transfer/top-up
  Cards     → app/(tabs)/accounts/cards
  More      → expandable bottom sheet (all available actions)
```

- Icons from Ionicons — use outline variants for inactive state
- "More" opens a bottom sheet listing all quick actions
- Order is hardcoded for MVP; configurable in Settings in a later phase

---

### 1.3 — Browse Products grid

Moved from the old Discover tab. 2×3 grid of category tiles. Tapping any tile navigates to the category listing in the AI Guide tab.

```
┌─────────────────────────────────┐
│ Browse products                 │
│ ┌────────┐ ┌────────┐ ┌───────┐ │
│ │ Cards  │ │Savings │ │ Loans │ │
│ └────────┘ └────────┘ └───────┘ │
│ ┌────────┐ ┌────────┐ ┌───────┐ │
│ │Insur.  │ │Invest. │ │Promos │ │
│ └────────┘ └────────┘ └───────┘ │
└─────────────────────────────────┘
```

- Fixed 3-column layout — no `auto-fit`
- Small dot badge on tile if AI advisor has a recommendation in that category
- Tapping Promos navigates to promotions listing (not AI advisory)
- Each tile: `router.push('/ai-guide/[category]')`

---

### 1.4 — Current promotions strip

Sits directly below Browse Products. Horizontal scroll of active promotion cards. Moved from old Discover tab.

```
┌─────────────────────────────────┐
│ Current promotions    See all → │
│ ┌──────────────┐ ┌────────────┐ │
│ │ 3% cashback  │ │ Fee waiver │ │  ← horizontal scroll
│ │ on dining    │ │ until Dec  │ │
│ │ Expires 31/12│ │            │ │
│ └──────────────┘ └────────────┘ │
└─────────────────────────────────┘
```

- Loads from `GET /promotions` — max 5 shown in strip, "See all" shows full list
- Eligibility check runs client-side from Zustand profile — no extra API call
- Ineligible promos shown greyed out; reason shown on tap

---

### 1.5 — Resume banner (conditional)

Shown only when the user has an in-progress agent execution saved. Appears between Quick Actions and Browse Products.

```
┌─────────────────────────────────┐
│ ↩ Resume application            │
│ Visa Platinum Card · Step 4/6   │
│                      [Resume →] │
└─────────────────────────────────┘
```

```typescript
// Visibility rule:
const progress = await api.getProgress(session.sessionId)
const showResumeBanner = progress !== null && progress.status === 'in_progress'

// Tapping Resume → navigates to ExecutionScreen with loaded progress context
// Tapping × dismisses and cancels the in-progress session
// Hidden entirely if no in-progress session exists
```

---

## AI Guide Section on Home — Chips Only

### Layout

No text input. No keyboard. No send button. Preset chips are the only interaction point. Each chip tap fetches a response and renders it inline — **replacing** the previous response, not appending to a thread. For a full conversation the user taps "Ask more →" which navigates to the AI Guide tab chat screen.

```
┌─────────────────────────────────┐
│ ✦ AI Guide                      │  ← section header with sparkle icon
│ ┌─────────────────────────────┐ │
│ │ 🤖 Hi, how can I help you   │ │  ← greeting bubble, always shown
│ │    today?                   │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Plan savings] [Current promos] │  ← chips always visible, never hidden
│ [Recommend a card] [Loan rates] │  ← horizontal scroll
│                                 │
│ ┌─────────────────────────────┐ │  ← response area, hidden until chip tapped
│ │ 🤖 Based on your profile,   │ │
│ │    here are savings options:│ │
│ │  ┌─────────────────────┐   │ │
│ │  │ High-Yield Savings  │   │ │  ← ProductChip(s) if response includes products
│ │  │ [View details →]    │   │ │
│ │  └─────────────────────┘   │ │
│ │  Ask more about this →     │ │  ← navigates to /ai-guide/chat
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Key rules:**
- No `TextInput`, no keyboard, no send button — remove entirely from `HomeChat`
- No `KeyboardAvoidingView` needed — no keyboard involvement
- Chips are **always visible** — never hidden after interaction
- Each chip tap **replaces** the response area (not appended) — only latest response shown
- Response area is hidden on first render — appears after first chip tap
- Loading state: animated 3-dot bubble replaces response area while fetching
- Error state: "Couldn't load response. Try again?" inside the response area with a retry tap
- "Ask more about this →" link navigates to `/ai-guide/chat` pre-seeded with the chip's message as context
- Section height: ~200px idle (greeting + chips); expands naturally when response renders

---

### 2.1 — Chip tap flow

```
User taps chip: "Recommend a card"
                    ↓
Show loading bubble in response area (3-dot animation)
                    ↓
POST /followup { message: chip.message, session_id }
                    ↓
Response: { screen: "chat", data: { reply: "...", products: [...] } }
                    ↓
Replace response area with:
  🤖 reply text
  ProductChip(s) if products present (max 3)
  "Ask more about this →" link
```

---

### 2.2 — Preset chips definition

```typescript
// constants/chatChips.ts
export const PRESET_CHIPS = [
  { label: "Plan savings",     message: "Help me plan my savings goals based on my financial profile." },
  { label: "Current promos",   message: "What promotions am I currently eligible for?" },
  { label: "Recommend a card", message: "Which credit card is best for my spending habits?" },
  { label: "Loan rates",       message: "What personal loan rates am I eligible for?" },
  { label: "My health score",  message: "Explain my current financial health score." },
  { label: "Best investment",  message: "What investment product suits my risk profile?" },
]
// Add/edit chips here only — no hardcoding in the component
```

- Chips scroll horizontally — max 6, no wrapping
- Chips are **always visible** — no hide rule

---

### 2.3 — HomeChat component structure (simplified)

```typescript
// components/HomeChat/index.tsx

interface ChipResponse {
  reply:    string
  products: Product[]
  loading:  boolean
  error:    boolean
}

const [response, setResponse] = useState<ChipResponse | null>(null)
// null = response area hidden (initial state)

async function handleChipTap(chip: { label: string; message: string }) {
  // 1. Show loading state immediately (replaces previous response)
  setResponse({ reply: "", products: [], loading: true, error: false })
  try {
    // 2. Call API
    const res = await api.followup(chip.message, session.sessionId)
    // 3. Replace with real response
    setResponse({
      reply:    res.data.reply,
      products: res.data.products ?? [],
      loading:  false,
      error:    false
    })
  } catch {
    setResponse({ reply: "", products: [], loading: false, error: true })
  }
}

// Render:
// Greeting bubble (always shown)
// Chips row (always shown, horizontal ScrollView)
// Response area (null → hidden, loading → 3-dot bubble, data → reply + ProductChips + "Ask more →")
// NO TextInput, NO send button, NO KeyboardAvoidingView
```

---

### 2.4 — Inline ProductChip component

```typescript
// components/HomeChat/ProductChip.tsx

// Layout:
// ┌──────────────────────────────────┐
// │ [Low risk]  High-Yield Savings   │  ← risk badge + name
// │ 4.5% projected return            │
// │ "Grow safely, no lock-in"        │  ← tagline, truncated 1 line
// │ [View details →]                 │
// └──────────────────────────────────┘

// Navigation on tap:
router.push({
  pathname: '/ai-guide/product/[id]',
  params: { id: product.product_id, from: 'home_chat' }
})
// "from: home_chat" param shows ← Home back arrow on product detail screen
```

---

## Traditional Flows — Step-by-Step Wizard

### Dual CTA on product detail screen

```
Sticky bottom section on product detail:
┌─────────────────────────────────┐
│ ✦ AI Guide                      │  ← primary CTA, navy fill
│   "Agent handles everything"    │  ← subtext sets expectation
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│   Apply manually                │  ← secondary CTA, outline style
│   "Step-by-step, you're in      │
│    control"                     │
└─────────────────────────────────┘

Navigation:
  AI Guide tap    → ExecutionScreen (existing agent flow)
  Apply manually  → /traditional/[product_id]
                    params: { product_id, product_type, pre_filled: profile }
```

- Promotions skip this dual CTA entirely — they remain one-tap activate
- Subtext under each button sets the expectation clearly — this is the contrast moment
- Both CTAs always visible regardless of eligibility state

---

### WizardShell — shared step wrapper

```typescript
// components/traditional/WizardShell.tsx

interface WizardField {
  key:       string                                              // maps to profile key or free-form
  label:     string
  type:      "text" | "number" | "select" | "date" | "toggle" | "otp"
  prefilled: string | null                                      // value from profile
  required:  boolean
  editable:  boolean                                            // false = read-only display
  options?:  string[]                                           // for select type
}

// Layout:
// ┌─────────────────────────────────┐
// │ ← Apply manually  Step 2 of 5  │  ← back arrow + step counter
// │ ████████░░░░░░░░░  40%          │  ← progress bar, navy fill
// │ Personal details                │  ← step title
// ├─────────────────────────────────┤
// │ Full name                       │
// │ [Alex Johnson           ]  ✓   │  ← pre-filled, confirm button right
// │                                 │
// │ Date of birth                   │
// │ [01 / 01 / 1990         ]  ✓   │
// ├─────────────────────────────────┤
// │              [Next step →]      │  ← disabled until all fields confirmed
// └─────────────────────────────────┘

// Confirmation mechanic:
// 1. Field is pre-filled from profile, displayed in greyed style
// 2. User taps ✓ → field border turns navy = confirmed
// 3. User can edit before confirming — editing resets confirmed state
// 4. "Next step" only enables when ALL fields on current step are confirmed
// 5. Back navigation shows warning: "Your progress will be lost"
```

---

### 3.2 — Cards — traditional flow (5 steps)

**Step 1 — Personal details**
| Field | Pre-filled from |
|---|---|
| Full name | `profile.full_name` |
| NRIC / Passport | `profile.id_number` |
| Date of birth | `profile.dob` |
| Mobile number | `profile.mobile` |
| Email address | `profile.email` |

**Step 2 — Address**
| Field | Pre-filled from |
|---|---|
| Home address line 1 | `profile.address_1` |
| Home address line 2 | `profile.address_2` |
| City / State | `profile.city` |
| Postcode | `profile.postcode` |
| Delivery address | Toggle: same as home OR enter new |

**Step 3 — Employment & income**
| Field | Pre-filled from |
|---|---|
| Employment status | `profile.job_stability` (select) |
| Employer name | `profile.employer` |
| Annual income | `profile.income` (editable number) |
| Credit limit preference | Auto-suggested = `income / 2`, user confirms (select: $1k / $3k / $5k / $10k) |

**Step 4 — Card preference** (not pre-filled — user selects)
- Card design (select from options if applicable)
- Statement cycle (select: 1st or 15th of month)
- Autopay (toggle: minimum / full balance)

**Step 5 — Review & confirm**
- Summary of all confirmed fields (read-only)
- Terms & conditions checkbox (must tick manually)
- OTP input (6-digit, sent when user reaches this step)
- `[Submit application]` button (disabled until T&C ticked + OTP entered)

```
On submit:
POST /traditional/apply { product_id, product_type: "card", form_data, session_id }
→ Success screen with reference number
→ Product surfaces in Accounts tab
```

---

### 3.3 — Savings — traditional flow (4 steps)

**Step 1 — Personal details** (same fields as Cards Step 1)

**Step 2 — Account setup**
| Field | Pre-filled from |
|---|---|
| Account nickname | Free text — e.g. "Holiday Fund" — **required**, appears as row label in Accounts tab |
| Initial deposit | Number input, min = `product.detail.min_deposit` |
| Tenor (fixed deposit only) | Select: 3 / 6 / 12 / 24 months — shown only for fixed deposit sub-type |
| Funding account | Select from user's **checking accounts only** |

**Step 3 — Account purpose (optional)**
- Savings goal (select: Emergency fund / House / Education / Holiday / Other)
- Target amount (number input, optional)
- Target date (date picker, optional)
- Note: if goal fields are filled, automatically creates a Goal entry via `POST /goals` after submission

**Step 4 — Review & confirm**
- Summary (read-only)
- Terms & conditions checkbox
- OTP input
- `[Open account]` button

```
On submit:
POST /traditional/apply { product_id, product_type: "savings", form_data }
→ Creates new savings account instance in accounts table
→ If goal fields filled → POST /goals automatically
→ Product surfaces in Accounts tab as its own named row (using nickname)
```

**Key rule:** Multiple submissions create multiple **independent** account instances. Same product ID, different nicknames, different opening balances — all appear as separate rows in the Accounts tab.

---

### 3.4 — Personal loans — traditional flow (5 steps)

**Step 1 — Personal details** (same as Cards Step 1)

**Step 2 — Employment & income**
| Field | Pre-filled from |
|---|---|
| Employment status | `profile.job_stability` |
| Employer name | `profile.employer` |
| Employment duration | Select: <1yr / 1–3yr / 3–5yr / 5yr+ |
| Monthly income | `profile.income / 12` (editable) |
| Other income sources | Toggle — amount field appears if yes |

**Step 3 — Loan details**
| Field | Behaviour |
|---|---|
| Loan amount | Number input with slider (min $1k, max based on income) |
| Loan tenure | Select: 12 / 24 / 36 / 48 / 60 months |
| Purpose of loan | Select: Medical / Education / Renovation / Travel / Other |

Live calculation shown below inputs (client-side, no API call):
```
Indicative monthly repayment: $612.00
Total repayable:               $22,032.00
(updates on every change to amount or tenure)
```

**Step 4 — Credit check consent**
- Plain-language explanation of what a credit check involves
- Checkbox: "I consent to a credit check being performed"
- **This field is NEVER pre-filled — always starts empty**
- This step cannot be skipped

**Step 5 — Review & confirm**
- Summary (read-only) including indicative rate and monthly repayment
- Terms & conditions checkbox
- OTP input
- `[Submit application]` button

```
On submit:
POST /traditional/apply { product_id, product_type: "loan", form_data }
→ Returns: indicative rate, monthly repayment, reference number, approval timeline
```

---

### 3.5 — Insurance — traditional flow (5 steps)

**Step 1 — Personal details** (Cards Step 1 + two additional fields)
- Gender (select — not in base profile, user provides)
- Smoking status (select: Non-smoker / Smoker / Ex-smoker — not pre-filled)

**Step 2 — Health declaration**
- Series of YES / NO toggle questions
- Examples: "Have you been diagnosed with a chronic illness?", "Had surgery in the past 5 years?"
- **None of these are pre-filled — all start blank/unanswered**
- User must answer every question before Next enables
- This step is always manual — no exceptions

**Step 3 — Coverage selection**
- Coverage tier (select with description: Basic / Standard / Premium)
- Coverage amount (pre-populated from tier, editable)
- Add-ons (multi-select: Critical illness / Total disability)

Live premium estimate shown below (client-side):
```
Estimated monthly premium: $45.00
Annual premium:            $540.00
```

**Step 4 — Payment setup**
- Payment frequency (select: Monthly / Quarterly / Annually)
- Payment method (select from checking accounts only)
- Start date (date picker, min: today + 7 days)

**Step 5 — Review & confirm**
- Summary including premium and coverage tier
- Terms & conditions + policy disclosure checkbox
- **Biometric confirmation** (replaces OTP for insurance — higher sensitivity product)
- `[Purchase plan]` button

```
On submit:
POST /traditional/apply { product_id, product_type: "insurance", form_data }
→ Returns: policy number, coverage start date
→ Surfaces in Accounts / Active Products
```

---

### 3.6 — Investments — traditional flow (5 steps)

**Step 1 — Personal details** (Cards Step 1 + two regulatory fields)
- Tax residency (select from country list — not pre-filled)
- Politically exposed person? (YES / NO toggle — not pre-filled, regulatory requirement)

**Step 2 — Risk acknowledgement**
- Displays: fund risk rating (e.g. "Risk Rating: 4 out of 7")
- Plain-language explanation of what that rating means
- Displays: past 1yr / 3yr / 5yr returns
- Displays: key risks (market risk, liquidity risk, currency risk)
- Checkbox: "I understand and accept the risks of this investment"
- **Never pre-filled — must be manually ticked (regulatory requirement)**

**Step 3 — Investment amount**
- Investment amount (number input, min = `product.detail.min_investment`)
- Funding account (select from checking accounts only)
- Recurring investment? (toggle)
  - If yes: monthly amount + recurring date (select: 1st / 15th / last day of month)

**Step 4 — Prospectus**
- Link to full fund prospectus (opens in browser)
- Checkbox: "I have read and understood the fund prospectus"
- **Never pre-filled — must be manually ticked (regulatory requirement)**

**Step 5 — Review & confirm**
- Summary (read-only)
- Terms & conditions checkbox
- OTP input
- `[Invest now]` button

```
On submit:
POST /traditional/apply { product_id, product_type: "investment", form_data }
→ Returns: units purchased, portfolio reference number
→ Surfaces in Accounts / Active Products
```

---

### New backend endpoint

```python
# POST /traditional/apply
# api.py

class TraditionalApplyRequest(BaseModel):
    product_id:   str
    product_type: str    # "card" | "savings" | "loan" | "insurance" | "investment"
    form_data:    dict   # all confirmed field values from wizard
    session_id:   str

@app.post("/traditional/apply")
def traditional_apply(req: TraditionalApplyRequest):
    # 1. Validate form_data against product rules (min deposit, eligibility, etc.)
    # 2. Write to orders table with source="traditional"
    # 3. If savings: create account instance in accounts table immediately
    # 4. If goal fields present in savings form_data: create goal record
    # 5. Return reference number + next steps

    order = {
        "order_id":     f"ord-{req.session_id}-{int(datetime.now().timestamp())}",
        "product_id":   req.product_id,
        "product_type": req.product_type,
        "source":       "traditional",
        "form_data":    json.dumps(req.form_data),
        "status":       "submitted",
        "reference_no": generate_reference(req.product_type),
        "created_at":   datetime.now().isoformat()
    }
    db["orders"].insert(order)

    return {
        "success":    True,
        "order_id":   order["order_id"],
        "reference_no": order["reference_no"],
        "message":    confirmation_message(req.product_type),
        "next_steps": next_steps(req.product_type)
    }
```

---

## Accounts Tab — Savings Breakdown & Cleanup

### Multiple savings instances

Each savings account opening creates an **independent row** in the Accounts tab, identified by the nickname the user gave during application.

```
┌─────────────────────────────────┐
│ Accounts                        │
├─────────────────────────────────┤
│ Checking                        │
│ ┌───────────────────────────┐   │
│ │ Main Checking  •••• 4521  │   │
│ │ $8,200.00 available       │   │
│ └───────────────────────────┘   │
├─────────────────────────────────┤
│ Savings                         │
│ ┌───────────────────────────┐   │
│ │ Holiday Fund              │   │  ← nickname from application
│ │ High-Yield Savings        │   │  ← product name as subtitle
│ │ $2,000.00 · 4.5% p.a.    │   │
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ House Deposit             │   │  ← second instance, same product
│ │ Fixed Deposit 12mo        │   │
│ │ $10,000.00 · 5.2% p.a.   │   │
│ └───────────────────────────┘   │
│ + Open another savings account  │  ← shortcut to Savings category
└─────────────────────────────────┘
```

- Each row = one account instance with its own balance, nickname, and product type
- Nickname comes from `form_data.account_nickname` (traditional) or defaults to `"{product_name} {n}"` for AI flow
- Tapping a row navigates to account detail — its own transaction history
- Section headers rendered conditionally — only shown if that account type exists

### Remove mock components

```
Remove entirely from accounts/index.tsx:
  ✗ Any placeholder "coming soon" cards
  ✗ Hardcoded mock account rows
  ✗ Mock balance numbers
  ✗ "Investment portfolio" placeholder (show only if user actually holds investments)
  ✗ "Loan summary" placeholder (show only if user has active loans)
  ✗ Any mock transaction preview rows

What remains after cleanup:
  ✓ Checking accounts section (from real DB)
  ✓ Savings accounts section (from real DB, multiple instances)
  ✓ Loans section (only if GET /accounts returns loan records)
  ✓ Cards section (only if GET /accounts returns card records)
  ✓ Active products section (insurance, investments — only if held)

Empty state (only checking account exists):
  Just the checking account row.
  No empty section headers.
  "Browse products to open your first savings account →" link below.
```

### DB schema — multiple savings instances

```python
# Each application (traditional or AI) that results in a savings account
# creates a NEW row in the accounts table — never updates an existing one.

# accounts table row (per savings instance):
{
    "account_id":    "sav-user001-1703001234",   # unique per instance
    "user_id":       "user-001",
    "product_id":    "SAV-001",                  # links to products.json
    "product_name":  "High-Yield Savings",       # denormalised for display
    "nickname":      "Holiday Fund",             # from form_data.account_nickname
    "type":          "savings",
    "sub_type":      "high_yield",
    "balance":       2000.00,
    "interest_rate": 4.5,
    "currency":      "USD",
    "status":        "active",
    "opened_via":    "traditional",              # "traditional" | "ai_agent"
    "opened_at":     "2024-01-15T10:30:00"
}

# GET /accounts/{user_id} returns ALL rows grouped by type:
{
    "checking": [ {...} ],
    "savings":  [ {...}, {...} ],   # multiple rows for same product_id is valid
    "loans":    [],
    "cards":    []
}
```

- No deduplication on `product_id` — same savings product can have many instances
- `opened_via` field enables analytics on AI vs Traditional adoption rates
- If `nickname` is blank: default to `"{product_name} {n}"` where n = instance number

---

## Transfer Screen — Checking-Only Restriction

### Filter logic

```typescript
// services/api.ts — helper function
export async function getTransferableAccounts(userId: string) {
  const res = await api.accounts(userId)
  // Savings, loans, investments excluded entirely
  return res.data.checking.filter(acc => acc.status === 'active')
}

// transfer/index.tsx
const [fromAccounts, setFromAccounts] = useState([])

useEffect(() => {
  getTransferableAccounts(session.userId).then(setFromAccounts)
}, [])

// Dropdown renders fromAccounts only
// Empty state (no checking account): "You need a checking account to make transfers."
```

### UI enforcement

```
Transfer screen — "From" field:
┌─────────────────────────────────┐
│ Transfer from                   │
│ ┌─────────────────────────────┐ │
│ │ Main Checking  •••• 4521    │ │  ← checking accounts only
│ │ $8,200.00 available      ▼  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

Multi-checking dropdown:
┌─────────────────────────────┐
│ ○ Main Checking  ••4521     │
│   $8,200.00                 │
│ ○ Joint Checking ••8833     │
│   $3,450.00                 │
└─────────────────────────────┘

Savings accounts do NOT appear in this list — not greyed, not present.
```

### Server-side guard

```python
# POST /transfers — belt-and-suspenders validation
@app.post("/transfers")
def initiate_transfer(req: TransferRequest):
    # Validate from_account is checking, belongs to user
    account = db["accounts"].get(req.from_account_id)
    if account["user_id"] != req.user_id:
        raise HTTPException(400, "Account does not belong to user")
    if account["type"] != "checking":
        raise HTTPException(400, "Transfers can only be made from checking accounts")
    # ... rest of transfer logic
```

- Savings accounts never appear in the UI dropdown — not greyed, not present at all
- Server rejects any `POST /transfers` where `from_account_id` belongs to a savings account
- "To" field is unrestricted — user can transfer to any account type or external recipient

---

## File Structure & Build Order

### File changes summary

```
RENAME   app/(tabs)/discover/         → app/(tabs)/ai-guide/
MODIFY   app/(tabs)/home.tsx          ← full overhaul
MODIFY   app/(tabs)/accounts/index.tsx ← savings breakdown + cleanup
MODIFY   app/(tabs)/transfer/index.tsx ← checking-only From field
MODIFY   ai-guide/product/[id].tsx    ← add dual CTA
NEW      app/traditional/[id].tsx     ← wizard router
NEW      components/HomeChat/index.tsx
NEW      components/HomeChat/ProductChip.tsx
NEW      components/traditional/WizardShell.tsx
NEW      components/traditional/steps/cards.ts
NEW      components/traditional/steps/savings.ts
NEW      components/traditional/steps/loans.ts
NEW      components/traditional/steps/insurance.ts
NEW      components/traditional/steps/investments.ts
NEW      constants/chatChips.ts
MODIFY   services/api.ts              ← add getTransferableAccounts, POST /traditional/apply
MODIFY   api.py (backend)             ← add POST /traditional/apply endpoint
```

### Recommended build order

```
Step 1   Rename discover/ → ai-guide/, update all router.push refs, update tab bar icon to sparkles
Step 2   Home screen header: BalanceHeader component (avatar, greeting, hidden balance, eye toggle)
Step 3   Move Browse Products + Promos grid to home.tsx, remove from ai-guide/index.tsx
Step 4   Remove Accounts list + Recent Transactions from home.tsx, verify scroll order
Step 5   Build HomeChat component — greeting bubble, chips row, response area (no TextInput, no KeyboardAvoidingView)
Step 6   Add dual CTA to product/[id].tsx (AI Guide + Apply manually), wire navigation
Step 7   Build WizardShell component with confirm-each-field mechanic and progress bar
Step 8   Write step configs for all 5 product types (cards, savings, loans, insurance, investments)
Step 9   Add POST /traditional/apply backend endpoint, write to orders + accounts tables
Step 10  Accounts tab cleanup: remove mock data, add savings instances, conditional section headers
Step 11  Transfer restriction: filter From dropdown to checking only, add server-side guard
Step 12  Run full Testing & Verification Checklist below
```

---

## Testing & Verification Checklist

- [ ] Tab bar shows "AI Guide" with sparkles/stars icon (not compass)
- [ ] Home screen shows left-aligned greeting and avatar with correct initials
- [ ] Balance hidden on cold app launch — displays `****` by default
- [ ] Eye icon toggles balance visibility correctly
- [ ] Balance visibility preference persists across app restarts (AsyncStorage)
- [ ] Home screen contains Browse Products 2×3 grid
- [ ] Home screen contains Current Promotions horizontal strip
- [ ] Home screen contains embedded AI Guide section with preset chips (no text input)
- [ ] Preset chips are always visible — never hidden after interaction
- [ ] Tapping a chip shows a loading bubble then replaces response area with AI reply
- [ ] Tapping a different chip replaces the previous response (does not append)
- [ ] AI response with products renders ProductChip cards inside response area
- [ ] "Ask more about this →" link navigates to AI Guide chat screen
- [ ] "Your Accounts" list is removed from Home
- [ ] "Recent Transactions" list is removed from Home
- [ ] Product detail screen shows two CTAs: "AI Guide" and "Apply manually"
- [ ] "AI Guide" CTA triggers existing agent execution flow
- [ ] "Apply manually" CTA navigates to traditional wizard for correct product type
- [ ] All wizard fields are pre-filled from stored profile
- [ ] "Next step" button is disabled until all fields on current step are confirmed (✓)
- [ ] User can edit a pre-filled field before confirming — edit clears confirmed state
- [ ] Health declaration fields (insurance Step 2) all start blank — none pre-filled
- [ ] Credit check consent (loans Step 4) starts blank — not pre-fillable
- [ ] Risk acknowledgement (investments Step 2) starts blank
- [ ] Prospectus confirmation (investments Step 4) starts blank
- [ ] Traditional submission POSTs to `/traditional/apply` and returns reference number
- [ ] Success screen shown after traditional submission with reference number and next steps
- [ ] Completed traditional savings application appears in Accounts tab as its own named row
- [ ] Opening same savings product twice creates two separate rows with different nicknames
- [ ] Accounts tab has no mock or placeholder components
- [ ] Section headers (Savings, Loans, etc.) only shown when user holds that account type
- [ ] Transfer "From" dropdown shows checking accounts only — no savings accounts present
- [ ] Server returns 400 when POST /transfers is called with savings account_id as from_account

---

*Full bank app. AI-powered and traditional paths. Users in control.*
