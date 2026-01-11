# Change Log — 2026-01-12

## Summary
Added live ETA estimations and resilience to the multi-racket flow so high-volume repeaters can see queue rhythm, recover from photo upload failures, and optionally clone their last configuration.

## Changes
- Added the `orderEta` helper plus ETA-first chips in the order list so every row now surfaces “已接单 / 预计完成 1-3 天 / 已完成” states derived from the backend queue metadata or fallbacks.
- Surface live ETA info inside the booking flow (Step 2 and Step 4) using the same helper and the repeat-order payload when available.
- Rebuilt the bulk photo diagnostics into a retry queue that keeps failed slots until the user confirms, exposes inline retry controls, reports the original file names, and vibrates/animates badges for accessibility feedback.
- Added an auto-fill template button for repeat orders that clones previous rackets (including photos) plus safe-area handling for the sticky action bar.
- Recorded the new retry queue workflow in the booking UI and made the action chips more descriptive so re-orders require fewer taps.

## Tests
- `npm run lint` (fails because the repo already has numerous lint warnings/errors such as `<FeaturedReviews>` violating `react/no-unescaped-entities` and wide `@typescript-eslint` reports.)
