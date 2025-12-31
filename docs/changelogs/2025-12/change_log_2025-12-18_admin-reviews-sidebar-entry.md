# Change Log — 2025-12-18

## Summary
Added “评价管理” entry to the Admin sidebar to access the existing Admin Reviews page and APIs.

## Changes
- Updated `src/app/admin/layout.tsx`
  - Added sidebar item “评价管理” → `/admin/reviews`

## Existing APIs (Already Implemented)
- `GET /api/admin/reviews`
- `GET /api/admin/reviews/stats`
- `POST /api/admin/reviews/{id}/reply`

## Tests
- Manual: open admin dashboard → verify sidebar shows “评价管理” → click it and confirm `/admin/reviews` loads and lists reviews.

