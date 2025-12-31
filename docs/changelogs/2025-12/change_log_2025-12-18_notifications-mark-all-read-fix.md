# Change Log — 2025-12-18

## Summary
Fixed Notifications panel “一键已读 / 全部标记为已读” not working (UI kept showing unread after marking).

## Changes
- Updated `src/services/notification.service.ts`:
  - Normalize API notifications from Prisma shape (`read`, `createdAt`) into UI-compatible aliases (`is_read`, `created_at`).
  - Return a consistent `{ notifications, unreadCount }` payload regardless of API wrapper (`{ success, data }`).

## Tests
- Manual: open Notifications panel → click “全部标记为已读” → verify unread badge becomes 0 and items lose unread styling.

