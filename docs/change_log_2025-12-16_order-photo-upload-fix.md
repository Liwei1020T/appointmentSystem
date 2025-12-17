# Change Log — 2025-12-16

## Summary
Fixed order photo uploads not persisting because the client was ignoring the wrapped upload API response and never returned a file URL.

## Changes
- Updated `src/services/imageUploadService.ts` to read `data.url` from the upload API response and treat missing URLs as failures instead of silent successes.
- Improved upload error surfacing so admin order photos, avatar uploads, and review images all report backend messages consistently.
- Fixed order photo API UUID casting errors by casting `order_id`, `photo_id`, and `uploaded_by` parameters in raw queries (`src/app/api/orders/[id]/photos/*`) to prevent `uuid vs text` failures during upload/list/reorder/delete.

## Tests
- Not run (environment not available). Manual check: upload a photo in admin order detail, confirm a new photo record appears and is visible in the user order gallery.
