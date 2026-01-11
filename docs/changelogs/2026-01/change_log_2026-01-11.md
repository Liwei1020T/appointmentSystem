# Change Log — 2026-01-11

## Summary
Batch upload diagnostics now map every photo to its racket slot, the order list surfaces next-action chips, and the multi-racket flow feels better on small screens (including a retry-queue crash fix and lifted photo-size cap).

## Changes
- Enhanced `MultiRacketBookingFlow` bulk upload to store each file name, flag per-slot success/failure, surface diagnostics, and let failed slots be retried inline.
- Added helper file input and toast feedback for slot-specific uploads so every racket knows which photo was applied.
- Introduced ETA/payment/pickup chips (with tone-aware badges) inside each order card to highlight the next action without leaving the list.
- Tightened the sticky mobile controls: the multi-racket layout now respects safe areas, the Step 2/4 bar acknowledges touch hit areas, and content is padded to avoid overlap with fixed footers.
- Documented the latest checkpoint in `docs/plans/optimization_checkpoint_2026-01-11.md` for future iterations.
- Fixed retry-queue handlers in `MultiRacketBookingFlow` so upload callbacks no longer reference uninitialized functions or contain stray syntax.
- Removed the 5MB validation cap for racket photo uploads in the booking flow.
- Removed the 5MB server-side upload cap (now unlimited unless `MAX_FILE_SIZE` is set).
- Updated `.gitignore` to ignore `public/uploads/` so uploaded photos/files are never committed.

## Tests
- Not run (UI changes only).
