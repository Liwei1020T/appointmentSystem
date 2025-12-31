# Change Log — 2025-12-19

## Summary
Fixed Home page runtime error by restoring the router hook usage.

## Changes
- Restored `useRouter()` usage in `src/features/home/HomePage.tsx` to prevent `router is not defined` runtime error.

## Tests
- Manual: open Home page; ensure no runtime error and redirects work when unauthenticated.
