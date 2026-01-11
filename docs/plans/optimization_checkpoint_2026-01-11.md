# Optimization Checkpoint — 2026-01-11

## What changed
- Strengthened the multi-racket bulk photo flow with per-slot diagnostics, persisted file names, and a retry queue (confirm/replace, retry, dismiss) so every upload now tells the user what succeeded or failed.
- Added next-action chips (ETA, payment pending, pickup ready) inside each order list row so the surface hints the next behaviour without entering the detail view.
- Surfaced live ETA estimates inside the booking flow (Step 2/4) and the order list using `getOrderEtaEstimate`, with sensible fallbacks when backend metadata is missing.
- Improved the multi-racket booking layout for compact screens by padding for Safe Area Insets, keeping sticky Step 2/4 controls tappable, and ensuring the sticky footer never hides card content.
- Removed the 5MB racket-photo cap (client + server). The server upload cap is now disabled by default unless `MAX_FILE_SIZE` is set.

## Next optimization ideas
1. Backfill the ETA helper with real queue data (position/start time/estimated days) from the backend so chips show truly live estimates.
2. Persist the retry queue (localStorage) so failed-slot decisions survive reloads until the user explicitly clears them.
3. Add a user preference toggle for haptics/animations and respect `prefers-reduced-motion`.
4. Expand “auto-fill template” to support choosing from multiple past orders (not only the most recent).
