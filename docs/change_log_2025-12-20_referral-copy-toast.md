# Change Log — 2025-12-20

## Summary
Added toast feedback when copying the referral code on the referral page.

## Changes
- UI: `src/features/profile/ReferralsPage.tsx` now shows success/warning/error toasts for copy actions.

## Tests
- Manual: click “复制” → toast appears with success message; try with empty code → warning toast.
