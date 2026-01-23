# Change Log — 2026-01-23 (Phase Optimizations)

## Summary
Delivered phased optimizations across referrals, packages, order automation, and analytics, plus documentation alignment for new admin tooling.

## Changes
- Updated referral tiers to 50/80/100 points and surfaced referral links for sharing.
- Added first-order-only packages and renewal discount logic with eligibility gating.
- Improved review sharing text with referral codes for social distribution.
- Enhanced restock suggestions with estimated profit calculations (supplier fields removed).
- Auto-advanced paid orders from `pending` to `in_progress` and logged admin status changes with notes.
- Added `order_status_logs` and `last_status_change_at`, with timeline updates for received/picked-up steps.
- Introduced admin order status notes UI and aligned order automation to last status change timestamps.
- Unified membership tier labels to DB enums (SILVER/GOLD/VIP) and refreshed profile stats mapping.
- Added promotion usage analytics summary to admin promotions API/UI.
- Refactored analytics calculations with a testable LTV helper.

## Tests
- `npm test -- src/__tests__/restockSuggestions.test.ts`
- `npm test -- src/__tests__/paymentStatus.test.ts`
- `npm test -- src/__tests__/orderStatusLog.test.ts`
- `npm test -- src/__tests__/OrderTimeline.test.tsx`
- `npm test -- src/__tests__/AdminOrderNotes.test.tsx`
- `npm test -- src/__tests__/orderAutomation.test.ts`
- `npm test -- src/__tests__/membershipTiers.test.ts`
- `npm test -- src/__tests__/promotionStats.test.ts`
- `npm test -- src/__tests__/analyticsCalculations.test.ts`
