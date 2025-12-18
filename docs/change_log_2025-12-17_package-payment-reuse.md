# Change Log — 2025-12-17

## Summary
Reused the order payment module for package purchases, fixed package payment creation, and renamed the two home quick-action cards.

## Changes
- Updated quick actions labels:
  - “购买套餐” → “我的套餐”，跳转到 `/profile/packages`
  - “兑换优惠券” → “我的优惠券”，跳转到 `/vouchers`
- Reused `OrderPaymentSection` in the package purchase flow and simplified it to a 3-step flow.
- Allowed payment components to support package payments:
  - `OrderPaymentSection` accepts `packageId`
  - `PaymentReceiptUploader` accepts `packageId` and stores receipts under a package folder
  - `TngQRCodeDisplay` supports a custom reference label
- Payment APIs now support `packageId` for TNG/现金支付 and set `metadata.type` accordingly.
- Admin payment confirmation now creates `user_packages` for package payments.

## Tests
- Manual: open home page and verify quick actions labels/links.
- Manual: open `/packages/purchase?id=<packageId>` and complete TNG or现金 flow; verify payment record creation and “支付已提交” state.
- Manual (admin): confirm package payment via `/admin/payments` to create `user_packages`.

