# Change Log — 2025-12-29

## Summary
Fixed vouchers routes to avoid Next.js build errors by adding redirect modules.
Fixed Profile page toast state typing to match the UI state shape.
Added role-based redirect after login.
Removed dedicated admin login page and component.
Added dashboard route with admin redirect guard.
Added tension difference enforcement (1-3 lbs) with UI guidance and server validation.
Added toast warnings on tension limits and fixed admin/user voucher stats display.
Added public reviews list and detail pages for "View all" access.
Reused ImagePreview for review photos and made review cards link to detail.
Refined review detail layout to match the requested rating/tags/order style.
Adjusted reviews list back action to return home page.
Added expand/collapse for package chips in the benefits card.

## Changes
- Added route module for `/vouchers/exchange` redirect to points exchange tab.
- Added route module for `/vouchers` redirect to points "my vouchers" tab.
- Aligned Profile page toast state type with `show`/`message` fields used in UI.
- Updated login success redirect to send admins to `/admin/dashboard` and users to `/dashboard`.
- Removed `/admin/login` route and `AdminLoginPage` component.
- Updated admin auth login API message to point to `/login`.
- Added `/dashboard` route to redirect admins to `/admin/dashboard` and render user home for regular users.
- Enforced 1-3 lbs tension difference rules in booking UIs and multi-racket order validation.
- Added toast warnings when trying to increase tension beyond limits in multi-racket booking.
- Added admin voucher users API and normalized voucher status mapping for accurate stats.
- Added public reviews API endpoints and new pages for full review browsing/detail.
- Reused ImagePreview modal on review detail images and linked review cards to detail pages.
- Updated review detail UI layout with rating breakdown, tags, and order total styling.
- Updated all reviews page back action to navigate to home.
- Added "+更多" expand and "收起" collapse to show all package chips in benefits summary.

## Tests
- Not run (dev/build not executed in this change).
