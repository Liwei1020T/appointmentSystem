# Change Log — 2025-12-18

## Summary
Optimized the review module by expanding the database schema, updating API endpoints, and improving the UI for better data persistence and display.

## Changes
- **Database Schema**:
  - Updated `Review` model in `prisma/schema.prisma` to include `serviceRating`, `qualityRating`, `speedRating`, `tags`, and `isAnonymous`.
  - Added `OrderPhoto` model to `prisma/schema.prisma` to properly manage order photos and avoid data loss during schema syncs.
- **API Updates**:
  - Updated `POST /api/reviews` to save all new review fields (sub-ratings, tags, anonymity).
  - Updated `GET /api/reviews` and `GET /api/reviews/order/[orderId]` to return the newly added fields.
- **Service Updates**:
  - Updated `review.service.ts` to handle the new fields in `normalizeReview`, `getUserReviews`, `getOrderReview`, and `submitReview`.
- **UI Updates**:
  - Improved `ReviewCard.tsx` to display review photos and admin replies.
  - Fixed an issue where reviews might show "0.0 分" due to missing data mapping.

## Tests
- Verified that new reviews correctly save and display sub-ratings (Service, Quality, Speed).
- Verified that tags and anonymity settings are preserved.
- Verified that photos uploaded with a review are displayed in the review card.
- Verified that admin replies are visible to users.
