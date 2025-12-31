# Change Log — 2025-12-29

## Summary
Added an admin review detail modal with image preview and a quick link to the related order.

## Changes
- Added a "查看详情" action to open the review detail modal in `src/features/admin/AdminReviewsPage.tsx`.
- Added a detail modal layout that shows full ratings breakdown, tags, comment, images, and admin reply.
- Added image preview support for review photos and a button to jump to the order detail page.
- Guarded review tag export to avoid undefined tags in CSV output.

## Tests
- Not run (not requested).
