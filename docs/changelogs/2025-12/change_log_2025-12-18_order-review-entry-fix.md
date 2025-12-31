# Change Log — 2025-12-18

## Summary
Fixed Order Detail page showing an “empty review” state after completion, preventing users from submitting a real review.

## Changes
- Updated `src/services/review.service.ts`:
  - Correctly parse `GET /api/reviews/order/:orderId` response when `review` is `null`.
  - Avoid creating a fake review via `normalizeReview()` when no review exists.

## Tests
- Manual: complete an order with no existing review → open order detail → verify the “立即评价” entry is shown (not a 0-star review card) and review form can be submitted.

