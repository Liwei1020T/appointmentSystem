# Change Log — 2025-12-17

## Summary
Hardened the review flow to avoid browser-side Prisma errors and updated documentation (AGENTS, API spec, ERD, system design) to reflect current placeholder endpoints and the actual schema.

## Changes
- Normalized review payloads (camel/snake) and lazy-loaded Prisma in `src/services/review.service.ts` to keep client bundles browser-safe; fixed submit response mapping so the UI receives actual ratings.
- Updated review-consuming pages to use API data safely (profile/reviews pages) instead of Prisma on the client, preventing runtime crashes and empty rating displays.
- Documented placeholder Next.js APIs for vouchers, packages, reports, and reviews in `docs/api_spec.md`; added the review module note to `docs/System-Design-Document.md`; refreshed `docs/erd.md` with `string_inventory.description` and the actual `reviews` table schema; updated `AGENTS.md` instructions to the actual doc filenames and to track temporary stubs.

## Tests
- Not run (UI-only/documentation update). Recommend manual smoke: submit a review on an order, verify rating renders correctly, and confirm no Prisma errors in the browser console.
