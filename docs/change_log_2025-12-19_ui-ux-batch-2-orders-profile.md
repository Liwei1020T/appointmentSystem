# Change Log — 2025-12-19

## Summary
Modernized Orders and Profile pages to the Kinetic Precision 2.0 system (dark layers, Volt accents, glass surfaces).

## Changes
- Updated order list styling and status badges:
  - `src/features/orders/OrderList.tsx`
  - `src/components/OrderStatusBadge.tsx`
  - `src/components/orders/OrderListPage.tsx`
- Updated order detail visuals for dark palette, payment sections, and bottom action bars:
  - `src/features/orders/OrderDetailPage.tsx`
- Updated profile pages (overview, edit profile, change password, my orders):
  - `src/features/profile/ProfilePage.tsx`
  - `src/features/profile/EditProfilePage.tsx`
  - `src/features/profile/ChangePasswordPage.tsx`
  - `src/features/profile/MyOrdersPage.tsx`

## Tests
- Manual: orders list and detail (status chips, payment sections, action bars).
- Manual: profile overview, edit profile, change password, my orders.
