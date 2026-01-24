# Referral Tier UI + Repeat-Rate Trend Design

**Date:** 2026-01-24
**Status:** Draft (approved)
**Owner:** AI Agent

## Goals
- Surface referral tier rewards clearly on `/profile/points` and `/profile/referrals`.
- Add a 12-month repeat-rate trend to the admin analytics dashboard.
- Reuse existing APIs and data flow where possible; avoid schema changes.

## Non-goals
- No cohort tables or retention cohorts.
- No changes to supplier or inventory logic.
- No changes to authentication or referral reward calculation logic.

## Requirements
### Functional
- `/profile/points` shows a compact referral tier ladder card with current tier and progress to next tier.
- `/profile/referrals` shows a tier rules table and highlights the current tier.
- `/admin/analytics` shows a repeat-rate trend chart (last 12 months) plus latest month repeat-rate card.
- Repeat-rate definition (Option A):
  - For each month, count users who placed at least one completed order in that month.
  - Among those users, mark as repeat users if lifetime completed orders >= 2 as of month end.
  - repeatRate = repeatUsers / orderingUsers (percent).

### Non-functional
- Keep UI consistent with Paper Court design system.
- If analytics data is missing, show safe defaults (0% + empty chart).
- API changes must be backward compatible.

## Architecture & Data Flow
### Analytics
- Add `getRepeatRateTrend(months = 12)` in `src/server/services/analytics.service.ts`.
- Use `prisma.$queryRaw` to compute monthly ordering users + lifetime repeat users as of each month end.
- Return rows with `month` (YYYY-MM), `orderingUsers`, `repeatUsers`, and `repeatRate` (0-100).
- Extend `getDashboardStats()` to include `repeatRateTrend`.
- Extend `/api/admin/analytics` response to include `repeatRateTrend`.

### Referrals
- `/api/referrals` already returns `stats.currentTier` and `stats.nextTier`.
- Add `tiers` array to the `/api/referrals` response for UI rendering:
  - `min`, `max` (null when unbounded), `points`, `badge`, and `badgeInfo`.
- `/profile/points` calls `/api/referrals` alongside existing points/vouchers fetches.
- `/profile/referrals` uses the same `tiers` array to render the rule table.

## UI/UX Details
### `/profile/points`
- Insert a "Referral Tier Ladder" card between the stats grid and the tab switcher.
- Card content:
  - Header: "推荐奖励" + subtitle "阶梯式积分奖励".
  - Current tier badge + points per referral.
  - Next tier progress: "还需 X 位" + thin progress bar (accent soft fill).
  - Footer: condensed tier rules (1-5 / 6-10 / 11+).
  - CTA: small button linking to `/profile/referrals`.
- Use `font-mono` for numbers, `bg-white`, `border-border-subtle`, `shadow-sm`.

### `/profile/referrals`
- Add a tier rules table above "邀请奖励规则" section.
- Three rows with ranges and points per referral; highlight current tier row.
- Update reward copy to be tier-aware (remove fixed 50 points text).

### `/admin/analytics`
- Add a new stat card: "本月复购率" (latest month from `repeatRateTrend`).
- Add a line chart below AOV trend:
  - X-axis: month (YYYY-MM), Y-axis: % repeat rate.
  - Tooltip with formatted percent (1 decimal).
- Keep existing layout and tokens; no palette changes.

## Error Handling
- If `repeatRateTrend` query fails, return empty array and 0% defaults.
- `/profile/points` should hide the referral tier card if referral API fails.
- If `stats.nextTier` is null, show "已达最高档位" and 100% progress.

## Testing Plan
- Unit tests for `getRepeatRateTrend` with mocked `$queryRaw` rows.
- Component test for referral tier card states (has next tier vs max tier).
- Referral page test for current tier highlight and tier table rendering.
- Update API spec with `repeatRateTrend` and referral tiers response fields.

## Rollout
- No schema migrations required.
- Deploy with standard build + start flow.
- Verify `/admin/analytics` returns new fields and UI renders on staging.
