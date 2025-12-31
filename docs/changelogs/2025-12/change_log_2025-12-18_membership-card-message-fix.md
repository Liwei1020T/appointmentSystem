# Change Log — 2025-12-18

## Summary
Fixed profile membership card incorrectly showing “已达到最高会员等级” for normal users due to wrapped API response parsing.

## Changes
- Updated `src/services/profileService.ts` to unwrap `{ success, data }` responses from `GET /api/user/stats`, restoring `membership.nextTier` and correct upgrade messaging.

## Tests
- Manual: open Profile page; confirm membership card shows upgrade prompt (e.g., “还需消费 RM xxx 可升级为 青铜会员”) when not at highest tier.

