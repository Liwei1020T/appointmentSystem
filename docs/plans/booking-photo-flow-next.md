# Booking Photo Flow & Order Tracking Optimizations

## ✅ Changes Applied
- Batch photo upload with replace-all toggle, progress bar, and retry/collapse messaging.
- Per-card replace/retry controls with inline upload error alerts, diagnostics badges, and accessibility labels.
- Step 2 cards now show missing-photo/diff-alert tags, lazy-loaded previews, plus detailed status chips listing each racket outcome.
- Pickup address validated on the fly, saved-address chips added, and Step 4 pricing gains dotted leaders with stronger totals.
- Order detail surfaces a “next step” card with an ETA/last-update stamp, and order list rows now show next-action chips.
- Accessibility/performance tweaks: aria states for controls, lazy loading, and updated changelog.
- Lifted the 5MB upload cap for racket photos (client validation removed; server cap disabled unless `MAX_FILE_SIZE` is set).

## 🔜 Next Optimizations
1. **Retry Queue Persistence:** Persist retry-queue decisions (localStorage) so failed-slot confirmations survive refresh/reload.
2. **Upload Confidence:** Add per-file upload progress + cancel, and show a clear “compressing / uploading” stage indicator for large photos.
3. **Preference Controls:** Provide user toggles for haptics/animations (respect `prefers-reduced-motion`) to avoid over-stimulating feedback.
4. **Template Library:** Allow selecting a past order as a template (not only the last one), including photo reuse and safe replacement confirmations.

Record progress in this file as you complete each item so future agents can continue from here.
