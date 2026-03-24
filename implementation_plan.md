# Dual Browse Products — Implementation Plan

## Architecture Overview

Two **Browse Products** grids exist in the app — same visual layout, different purchase behavior.

```
HOME SCREEN                          AI GUIDE TAB
┌──────────────────────┐             ┌──────────────────────┐
│  Browse Products     │             │  Browse Products  ✨ │
│ ┌─────┐ ┌─────┐     │             │ ┌──────┐ ┌──────┐   │
│ │Cards│ │Sav. │ ... │             │ │Cards✨│ │Sav.✨│...│
│ └─────┘ └─────┘     │             │ └──────┘ └──────┘   │
│                      │             │                      │
│  Tap → Product list  │             │  Tap → AI retrieves  │
│  Tap item → Detail   │             │  relevant products   │
│  Tap Purchase →      │             │  Tap Purchase →      │
│  MANUAL form wizard  │             │  AI AUTO-FILLS form  │
│  Fill fields + OTP   │             │  User only types OTP │
│  → Active Products   │             │  → Active Products   │
└──────────────────────┘             └──────────────────────┘
```

---

## Flow Diagrams

### Traditional Flow (Home Screen)

```
Category Grid → Product List → Product Detail → [Purchase]
  → Step-by-step Form Wizard (user fills every field)
  → Confirm + OTP
  → ResultCard → saved to Active Products
```

### AI-Assisted Flow (AI Guide Tab)

```
Category Grid (✨ icon) → [Tap category]
  → AI backend retrieves relevant/recommended products
  → Product List (ranked by relevance)
  → Tap product → [Purchase]
  → AI auto-fills the form (pre-populated from profile + AI logic)
  → User reviews → types OTP only
  → ResultCard → saved to Active Products (identical to traditional)
```

---

## Proposed Changes

### Component: Shared Category Grid

#### [NEW] [BrowseProductsGrid.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/components/products/BrowseProductsGrid.tsx)

Shared 2×3 category grid used by **both** Home and AI Guide. Props:

```typescript
interface Props {
  aiMode?: boolean;        // shows ✨ icon on each tile top-right
  onCategoryTap: (categoryKey: string) => void;
}
```

- `aiMode=false` → plain tiles (Home screen)
- `aiMode=true` → each tile has a small sparkles icon top-right corner

---

### Path A: Traditional (Home Screen)

#### [MODIFY] [home.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/app/(tabs)/home.tsx)

- Replace current inline `CATEGORIES` grid with `<BrowseProductsGrid aiMode={false} />`
- On tap: set state to show `ProductListScreen` (category product listing)
- From product list → `ProductDetailScreen` → "Purchase" button
- "Purchase" → [WizardShell](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/components/traditional/WizardShell.tsx#36-241) (existing step-by-step form, user fills everything)
- After OTP + submit → `ResultCard`
- Internal view state machine: `home | productList | productDetail | wizard | result`

The full traditional flow lives **inside** [home.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/app/%28tabs%29/home.tsx) as view states (same pattern [discover.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/app/%28tabs%29/discover.tsx) uses today).

---

### Path B: AI-Assisted (AI Guide Tab)

#### [MODIFY] [discover.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/app/(tabs)/discover.tsx)

Restructure the AI Guide tab to have two sections:
1. **Chat UI** (existing — at the top) 
2. **Browse Products ✨ grid** (at the bottom, using `<BrowseProductsGrid aiMode={true} />`)

On category tap:
1. Show loading state — "AI is finding the best products for you…"
2. Backend call: `POST /ai-guide/recommend` → returns ranked product list for that category based on user profile
3. Display AI-curated product list (same card layout as traditional, but ranked/filtered by AI)
4. On tap product → show product detail
5. "Purchase" button → AI auto-fill flow:
   - Call `POST /ai-guide/auto-apply` → backend uses AI to determine optimal form values
   - Frontend receives pre-filled form data
   - Show the filled form to user for review (read-only, all fields pre-populated)
   - User only action: **type OTP**
   - Submit → `ResultCard` (identical to traditional)

Internal view state machine: `home | aiProductList | productDetail | aiAutoFill | result`

---

### Component: Shared Result

#### [NEW] [ResultCard.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/components/shared/ResultCard.tsx)

Single result component used by **both** paths. Identical output.

```typescript
interface ResultCardProps {
  productName: string;
  productType: string;
  referenceNo: string;
  keyDetails: { label: string; value: string }[];
  nextSteps: string;
  onViewActiveProducts: () => void;
  onBrowseMore: () => void;
}
```

- Animated checkmark → Product name → Reference number → Key details → Next steps → CTAs
- **No agent log** on result screen

#### [DELETE] [SummaryCard.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/components/execution/SummaryCard.tsx)

Replaced by `ResultCard`.

---

### Backend Changes

#### [MODIFY] [api.py](file:///d:/Swin%20documents/Swinhackathon/finance-advisor/api.py)

**New endpoints:**

1. `POST /ai-guide/recommend` — AI retrieves relevant products for a category
   ```python
   Request:  { "user_id": str, "category": str }
   Response: { "products": Product[], "ai_note": str }
   ```

2. `POST /ai-guide/auto-apply` — AI auto-fills a product application form
   ```python
   Request:  { "user_id": str, "product_id": str, "product_type": str }
   Response: { "filled_form": dict, "ai_rationale": str }
   ```
   The `filled_form` matches the same field keys as [WizardShell](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/components/traditional/WizardShell.tsx#36-241) step configs.

**Modify existing:**

3. `POST /traditional/apply` — add `key_details` to response
   ```python
   Response adds: "key_details": [{"label": "Credit Limit", "value": "$5,000"}, ...]
   ```

**DB records:** Both paths write identical [orders](file:///d:/Swin%20documents/Swinhackathon/finance-advisor/api.py#739-754) and [accounts](file:///d:/Swin%20documents/Swinhackathon/finance-advisor/api.py#250-259) rows. `source` field = `"traditional"` or `"ai_agent"`, stored but never shown in UI.

#### [MODIFY] [api.ts](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/services/api.ts)

- Add `getAiRecommendations(userId, category)` 
- Add `getAiAutoFill(userId, productId, productType)`
- Rename [TraditionalApplyResponse](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/services/api.ts#422-428) → `PurchaseResult` (shared type with `key_details`)

---

## Summary Table

| Aspect | Traditional (Home) | AI-Assisted (AI Guide) |
|--------|-------------------|----------------------|
| Grid icon | Plain tiles | ✨ sparkles top-right |
| Product list | All products in category | AI-ranked relevant products |
| Form filling | User fills every field | AI auto-fills, user reviews |
| User action required | All fields + OTP | OTP only |
| Result screen | `ResultCard` | `ResultCard` (identical) |
| DB record | `source: "traditional"` | `source: "ai_agent"` |
| Active Products row | Identical | Identical |

---

## Verification Plan

| Test | Steps | Expected |
|------|-------|----------|
| Traditional browse | Home → Cards → pick card → Purchase → fill form → OTP → submit | ResultCard with ref number, saved to Active Products |
| AI browse | AI Guide → Cards✨ → AI loads relevant cards → pick card → Purchase → form auto-filled → type OTP → submit | Same ResultCard format, saved to Active Products |
| Grid distinction | Compare Home grid vs AI Guide grid | AI Guide tiles have ✨ icon |
| Same output | Complete both paths for same product type | Identical ResultCard, identical Accounts row |
| Backend recommend | `POST /ai-guide/recommend` with category | Returns ranked product list |
| Backend auto-fill | `POST /ai-guide/auto-apply` with product | Returns pre-filled form data |
