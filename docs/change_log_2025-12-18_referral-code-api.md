# Change Log — 2025-12-18

## Summary
Implemented missing referral-code API route to fix profile referral code generation.

## Changes
- Added API: `POST /api/profile/referral-code` to return or generate/persist the authenticated user's referral code.
- Updated docs: `docs/api_spec.md` to document the endpoint.

## Tests
- Manual: open Profile page; verify request to `/api/profile/referral-code` returns JSON and the UI no longer logs `404 (Not Found)` / `not valid JSON`.

