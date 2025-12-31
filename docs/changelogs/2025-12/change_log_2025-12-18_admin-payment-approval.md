# Change Log — 2025-12-18

## Summary
Fixed admin payment approval flow for both order payments and package purchases (TNG receipt + cash), so admins can approve and users will see activated packages after approval.

## Changes
- API: `POST /api/payments/[id]/receipt` now merges `metadata`, writes `receiptUrl`, and sets `status` to `pending_verification`.
- API: `POST /api/payments/[id]/proof` now supports package payments, fixes ownership check, merges `metadata`, and sets `status` to `pending_verification`.
- API: `GET /api/admin/payments/pending` now returns pending payments correctly (no `proofUrl` column dependency) and includes `user`, `order`, and `package` relations.
- Admin UI: added sidebar entry `支付审核` → `/admin/payments`.
- Admin UI: `PaymentVerificationPage` now supports order + package payments, reads proof URL from `metadata.receiptUrl/proofUrl`, and confirms via `/confirm` or `/confirm-cash` based on provider.
- API: cash confirm now marks payment as `success` (consistent with non-cash confirm).
- API: reject now blocks already-success payments and records `rejectReason` in `metadata`.
- UI: aligned payment status handling (`success/completed`, `pending_verification`) in receipt verifier and order timeline.
- Fix: removed stray lines in `src/app/api/reviews/route.ts` that broke TypeScript/build compilation.

## Impact
- Admins can reliably find pending payments and approve them.
- Package purchase payments create `user_packages` upon admin confirmation, enabling users to see packages immediately.
- Receipt images now display in admin without Next.js remote image domain config (uses `<img>`).

## Tests
- Manual: create a package purchase → choose `TNG` → upload receipt → verify it appears in `管理后台 > 支付审核` and approve → confirm the user sees the package in `我的套餐`.
- Manual: create a package purchase → choose `现金` → confirm it appears in `管理后台 > 支付审核` and approve → confirm the user sees the package in `我的套餐`.
- Manual: order payment with receipt upload shows as `pending_verification` and can be approved.
