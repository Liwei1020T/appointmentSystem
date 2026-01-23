# Change Log — 2026-01-23

## Summary
Expanded restock suggestions with estimated profit, added admin order status notes UI, and surfaced full referral links in sharing.

## Changes
- Updated restock suggestions to include an estimated profit per suggestion.
- Exported and tested the restock quantity helper for baseline validation.
- Automatically advance pending orders to in-progress after payment success.
- Added order status log table and last status change timestamp on orders.
- Logged admin order status transitions with optional notes.
- Extended order timeline to show received/picked-up steps and optional status notes.
- Added a status notes card to the admin order detail sidebar.
- Displayed full referral links in the referral share experience with environment-based base URLs.
- Switched order automation timeout checks to use last status change timestamps.
- Unified membership tier labels and stats to align with DB enum values.
- Added promotion usage analytics summary to the admin promotions API and UI.
- Added a testable LTV helper and refactored admin analytics calculations.

## Tests
- `npm test -- src/__tests__/restockSuggestions.test.ts`
- `npm test -- src/__tests__/AdminOrderNotes.test.tsx`
- `npm test -- src/__tests__/orderAutomation.test.ts`
- `npm test -- src/__tests__/membershipTiers.test.ts`
- `npm test -- src/__tests__/promotionStats.test.ts`
- `npm test -- src/__tests__/analyticsCalculations.test.ts`
