# Booking Photo Flow & Order Tracking Optimizations

## ✅ Changes Applied
- Batch photo upload with replace-all toggle, progress bar, and retry/collapse messaging.
- Per-card replace/retry controls with inline upload error alerts, diagnostics badges, and accessibility labels.
- Step 2 cards now show missing-photo/diff-alert tags, lazy-loaded previews, plus detailed status chips listing each racket outcome.
- Pickup address validated on the fly, saved-address chips added, and Step 4 pricing gains dotted leaders with stronger totals.
- Order detail surfaces a “next step” card with an ETA/last-update stamp, and order list rows now show next-action chips.
- Accessibility/performance tweaks: aria states for controls, lazy loading, and updated changelog.

## 🔜 Next Optimizations
1. **Batch Upload Diagnostics:** Map each uploaded file to a specific racket, show per-slot success/failure indicators, and allow re-upload for failed slots.
2. **Order List Tracking:** Surface “next action” chips (ETA, payment pending, pickup ready) in the order list rows to reduce taps.
3. **Mobile QA Fixes:** Run through mobile breakpoints, adjust spacing/overscroll, and validate touch hit areas, especially for the sticky controls at Step 2/4.

Record progress in this file as you complete each item so future agents can continue from here.
