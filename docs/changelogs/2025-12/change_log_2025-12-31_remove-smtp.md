# Change Log — 2025-12-31

## Summary
Removed all SMTP/email notification support from the codebase. The project will use WhatsApp as the primary notification channel instead.

## Changes

### Removed
- **`notificationService.ts`**: Removed all `email_*` fields from `NotificationPreferences` interface
  - `email: boolean`
  - `email_enabled?: boolean`
  - `email_order_updates?: boolean`
  - `email_payment_updates?: boolean`
  - `email_promotions?: boolean`
  - `email_system?: boolean`
- **`notificationService.ts`**: Removed email mock data from `getNotificationPreferences()` function

### Modified
- **`NotificationSettingsPage.tsx`**: 
  - Removed entire "邮件通知" (Email Notifications) settings section
  - Removed `Mail` icon import from `lucide-react`
  - Added "WhatsApp 通知 (即将推出)" placeholder section

### Documentation Updates
- **`docs/status/PROJECT_STATUS.md`**: Changed "配置 SMTP（如需邮件通知）" to "配置 WhatsApp Cloud API（主要通知渠道）"
- **`docs/changelogs/2025-01/change_log_2025-01-12_ui-pages.md`**: Changed "Configure SMTP for email notifications" to "Configure WhatsApp Cloud API for notifications"

## Notes
- No actual SMTP/nodemailer code existed in the codebase, only interface definitions and UI components
- `package.json` does not contain nodemailer dependency (residual references in `package-lock.json` are from previous installations)
- User `email` field in database remains unchanged (used for user identification, not notifications)
- WhatsApp integration plan is documented in `docs/plans/WhatsApp-Integration-Plan-v2.1.md`

## Tests
- ✅ TypeScript type check passes (`npm run type-check`)
- ❌ No UI test performed (manual verification recommended)
