# Change Log — 2025-12-17

## Summary
Fixed runtime crash in `OrderPaymentSection` when using package payments (`packageId is not defined`).

## Changes
- `src/components/OrderPaymentSection.tsx`
  - Destructured `packageId` from props so package payment flow can reference it safely.

## Database
- No database changes required.

## Tests
- Manual: open `/packages/purchase?id=<packageId>` and confirm the payment section renders without crashing.

