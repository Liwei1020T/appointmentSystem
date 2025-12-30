# Change Log — 2025-12-30

## Summary
Removed the duplicate header on the landing page by hiding the global Navbar for unauthenticated visitors on `/`.

## Changes
- Updated `src/components/layout/Navbar.tsx` to skip rendering on the landing page when the user is not authenticated.
- Added `isValidUUID` helper in `src/lib/utils.ts` to fix missing import errors across API/services.
- Added `normalizeMyPhone`, `validatePhone`, and `validatePassword` helpers in `src/lib/utils.ts` to fix missing imports and unify auth validation.
- Added `formatDate`, `formatCurrency`, `calculateDaysRemaining`, and `generateShortCode` helpers in `src/lib/utils.ts` to fix missing imports used across UI/admin pages.
- Updated landing FAQ CTA button to use supported `Button` variant to fix type error.
- Updated landing features animation easing to use `cubicBezier()` for framer-motion variant type safety.
- Updated `LandingPage` to render `HomePage` for authenticated sessions to avoid landing header conflicts.
- Removed payment account env variables and UI output since TNG QR-only flow no longer displays account details.
- Normalized uploaded image URLs to absolute origins to prevent missing previews on custom domains.
- Updated booking tension rules to allow 0-3 lbs difference and adjusted related copy.

## Tests
- Manual: load `/` while logged out and confirm only the landing header is visible.
- Manual: re-run the build to ensure `isValidUUID` import errors are resolved.
- Manual: re-run the build to ensure auth-related utils import errors are resolved.
- Manual: re-run the build to ensure admin/order list utils import errors are resolved.
- Manual: re-run the build to ensure the FAQ button variant type error is resolved.
- Manual: re-run the build to ensure the landing features variants type error is resolved.
- Manual: log in and hit `/` to confirm the landing header no longer appears.
- Manual: open a payment page to confirm no account details are shown.
- Manual: upload a racket photo on the domain and confirm the preview renders.
- Manual: verify tension difference accepts 0-3 lbs in booking flows.
