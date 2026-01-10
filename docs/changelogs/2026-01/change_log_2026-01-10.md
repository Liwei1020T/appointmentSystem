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
- Tightened Step 2 validation to require valid tension differences before enabling the next step.
- Auto-scroll to the first invalid racket card when validation fails.

## Tests
- Not run (UI changes only).
