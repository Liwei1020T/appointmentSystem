# Change Log — 2025-01-13

## Summary
Wrapped pages that use search parameters in Suspense to satisfy Next.js CSR bailout requirements and ensure production build completes.

## Changes
- Updated page wrapper: app/payment/result/page.tsx now renders PaymentResultPage inside Suspense.
- Updated page wrapper: app/packages/purchase/page.tsx now renders PackagePurchaseFlow inside Suspense.
- Updated page wrapper: app/signup/page.tsx now renders SignupPage inside Suspense.

## Tests
- npm run build
