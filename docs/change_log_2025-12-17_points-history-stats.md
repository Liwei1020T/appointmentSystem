# Change Log — 2025-12-17

## Summary
Added missing points stats/history APIs and normalized client parsing to resolve JSON errors on the points page.

## Changes
- Added `/api/points/stats` and `/api/points/history` to return points aggregates and logs (`src/app/api/points/stats/route.ts`, `src/app/api/points/history/route.ts`).
- Normalized points service parsing for wrapped responses in `src/services/points.service.ts`.

## Tests
- Not run (recommend visiting "我的积分" to confirm stats and history load without JSON errors).
