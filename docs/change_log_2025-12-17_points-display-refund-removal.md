# Change Log — 2025-12-17

## Summary
Fixed points display formatting and removed refund-related UI on the points page.

## Changes
- Normalized points amount display to avoid negative zero and double signs in `src/features/points/PointsHistoryPage.tsx`.
- Removed refund stats card and refund filter tab from the points page UI.

## Tests
- Not run (recommend opening "我的积分" to confirm amounts show correctly and refund tab is gone).
