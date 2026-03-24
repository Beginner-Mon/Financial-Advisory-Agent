# Dual Browse Products — Task Checklist

## 1. Shared BrowseProductsGrid Component
- [ ] Create `components/products/BrowseProductsGrid.tsx` — 2×3 grid, `aiMode` prop adds ✨ icon
- [ ] Extract category definitions into shared constant

## 2. Traditional Flow (Home Screen)
- [ ] Add `BrowseProductsGrid aiMode={false}` to [home.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/app/%28tabs%29/home.tsx)
- [ ] Add view states: `home | productList | productDetail | wizard | result`
- [ ] Product list view: fetch products by category, show list
- [ ] Product detail view: show detail + "Purchase" button
- [ ] Purchase → existing [WizardShell](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/components/traditional/WizardShell.tsx#36-241) (user fills all fields + OTP)
- [ ] After submit → `ResultCard` → saved to Active Products

## 3. AI-Assisted Flow (AI Guide Tab)
- [ ] Add `BrowseProductsGrid aiMode={true}` below the chat in [discover.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/app/%28tabs%29/discover.tsx)
- [ ] Add view states: `home | aiProductList | productDetail | aiAutoFill | result`
- [ ] On category tap: call `POST /ai-guide/recommend` → show AI-ranked products
- [ ] Product detail view: same component, "Purchase" button
- [ ] Purchase → call `POST /ai-guide/auto-apply` → show pre-filled form (read-only)
- [ ] User types OTP only → submit → `ResultCard`

## 4. Shared ResultCard
- [ ] Create `components/shared/ResultCard.tsx` — checkmark, ref#, key details, next steps
- [ ] Used by both traditional and AI path after submission
- [ ] Delete old [SummaryCard.tsx](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/components/execution/SummaryCard.tsx)

## 5. Backend — New AI Endpoints
- [ ] `POST /ai-guide/recommend` — returns ranked products for a category + user profile
- [ ] `POST /ai-guide/auto-apply` — returns auto-filled form data for a product
- [ ] Update `POST /traditional/apply` to include `key_details` in response

## 6. Frontend API Layer
- [ ] Add `getAiRecommendations(userId, category)` to [api.ts](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/services/api.ts)
- [ ] Add `getAiAutoFill(userId, productId, productType)` to [api.ts](file:///d:/Swin%20documents/Swinhackathon/finance-advisor-app/services/api.ts)
- [ ] Rename response type to shared `PurchaseResult` with `key_details`

## 7. Accounts Tab — Active Products
- [ ] Verify both paths create identical account rows
- [ ] `opened_via` stored but never shown in UI

## 8. Verification
- [ ] Traditional: Home → Category → Product → Purchase → Fill form → OTP → ResultCard
- [ ] AI: AI Guide → Category✨ → AI recommends → Product → Purchase → Auto-fill → OTP → ResultCard
- [ ] Both ResultCards identical format
- [ ] Both create identical Active Products rows
- [ ] AI Guide tiles show ✨ icon, Home tiles don't
