# Change Log — 2026-01-10

## Summary
Improved booking Step 2 guidance with quick sync tools, completion feedback, and added repeat-order CTAs across order views.

## Changes
- Added repeat booking CTA to the order list and detail summary, reusing the `repeatOrderId` prefill.
- Added a Step 2 checklist panel in multi-racket booking with completion stats and quick navigation to unfinished cards.
- Added quick sync controls to copy tension/notes from a selectable template racket plus a bottom-bar incomplete hint with jump action.
- Added per-card template selection controls for faster template switching in Step 2.
- Added quick actions to sync only tension or clear notes across rackets.
- Added a compact Step 2 header progress pill to show completion status at a glance.
- Added batch photo upload to fill remaining racket slots with progress feedback.
- Added a “replace all photos” toggle in batch upload for full re-shoot workflows.
- Added per-card photo replace/retry actions with inline error feedback.
- Added pickup address validation plus saved address chips for faster selection.
- Refined Step 4 price breakdown with dotted leaders and stronger totals.
- Added an order detail “next step” tracking card with update timestamp.
- Added accessibility labels/state for booking controls and lazy-loaded order images.
- Tightened Step 2 validation to require valid tension differences before enabling the next step.
- Auto-scroll to the first invalid racket card when validation fails.

## Tests
- Not run (UI changes only).
