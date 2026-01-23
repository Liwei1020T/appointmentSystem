# First-Order Auto-Issue Voucher Design

**Date:** 2026-01-23  
**Status:** Approved  
**Scope:** New user incentive via auto-issued, first-order-only vouchers.

## Goal
Enable admins to configure a first-order voucher (RM3–5) that is auto-issued on signup, expires after a configurable window, and is enforced at order creation.

## Decision Summary
- Reuse existing voucher fields: `isAutoIssue`, `isFirstOrderOnly`, `validityDays`.
- Keep auto-issue logic in signup via `issueWelcomeVouchers`.
- Enforce first-order-only eligibility in server-side order creation.
- No new tables or cron jobs.

## Architecture
The admin API and UI will expose voucher flags for auto-issue and first-order eligibility. During signup, `issueWelcomeVouchers` issues any voucher with `isAutoIssue=true` and within valid date range, calculating expiry from `validityDays` where provided. Order creation flows (`createOrder`, `createOrderWithPackage`, `createMultiRacketOrder`) validate vouchers and call a shared helper to reject first-order-only vouchers for users who have existing in-progress or completed orders. This enforcement is server-side to prevent client bypass. Admin list/detail pages surface quick badges (“自动发放”, “首单专属”) and form inputs to configure these flags.

## Components & Data Flow
1. Admin creates/edits voucher with `isAutoIssue`, `isFirstOrderOnly`, and `validityDays`.
2. Signup triggers `issueWelcomeVouchers`, which creates `user_vouchers` and a notification.
3. User selects voucher in checkout; client shows standard availability.
4. Order creation loads voucher details, validates dates/min purchase, and enforces first-order-only eligibility.
5. If eligible, order is created and voucher marked used; otherwise, API returns validation error.

## Error Handling
- First-order-only voucher used by ineligible user returns `422` with message “此优惠券仅限首单使用”.
- Voucher issuance failures are logged but do not block signup.
- Admin form defaults flags to false; `validityDays` is optional (falls back to `validUntil`).

## Testing
- Unit tests for first-order eligibility guard (mocking `prisma.order.count`).
- Order service test verifying first-order-only vouchers reject ineligible users.
- Admin voucher normalization test for new flags.
- Admin list UI test to ensure badges render.

## Non-Goals
- No new incentive settings table.
- No scheduled expiry/notification jobs beyond existing voucher expiry logic.
