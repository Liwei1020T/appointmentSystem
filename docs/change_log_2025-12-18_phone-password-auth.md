# Change Log — 2025-12-18

## Summary
Switched authentication to **phone number + password** (no email). “Forgot password” now uses **SMS OTP** to reset password.

## Changes
- Database:
  - `prisma/schema.prisma`:
    - `users.email` is nullable (kept for backward compatibility, not used in user flows).
    - `users.password` is nullable for legacy users; new signup requires password.
    - Added `otp_codes` table for OTP-based password reset (stores only hashed codes).
  - Added migration plan: `sql/migrations/014_phone_otp_auth.sql` (email/password nullable + `otp_codes`).
- Auth (NextAuth):
  - Updated `src/lib/auth.ts` Credentials provider to authenticate with `{ phone, password }` (optional `admin=true` for admin login).
  - Session callback fetches latest user snapshot from DB and exposes `phone`, `points`, `referral_code` for UI.
- API:
  - `POST /api/auth/signup` now supports **phone + password** signup (no email), including referral rewards.
  - `POST /api/auth/otp/request` now issues OTP codes only for `purpose=password_reset`.
  - `POST /api/auth/password-reset/confirm` verifies OTP and sets a new password hash.
  - `PUT /api/user/password` allows authenticated users to change password (verifies current password when present).
- UI:
  - `src/features/auth/LoginPage.tsx` uses phone + password login, with “忘记密码”入口。
  - `src/features/auth/SignupPage.tsx` uses phone + password signup, and auto logs in after signup.
  - `src/features/auth/ForgotPasswordPage.tsx` supports phone → OTP → new password reset flow.
  - `src/features/auth/ProfilePage.tsx` re-enabled password change UI (calls `/api/user/password`).
  - `src/components/admin/AdminLoginPage.tsx` uses phone + password admin login.
  - `src/components/layout/Navbar.tsx` display prefers `name` → `phone` → `email`.

## Environment
- Twilio SMS (optional, used for password reset OTP):
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`
- OTP hashing:
  - `OTP_SECRET` (optional; falls back to `NEXTAUTH_SECRET`)
- Dev helper:
  - `SMS_DEV_RETURN_CODE=true` (non-production only) to return `devCode` in OTP response for testing.

## Tests
- Manual:
  - Signup: `/signup` → phone + password →注册成功并自动登录。
  - Login: `/login` → phone + password → 登录成功。
  - Forgot password: `/forgot-password` → phone → 获取验证码 → 输入 OTP + 新密码 → 重置成功后回到登录。
  - Profile: `/profile` → 修改密码 → 成功保存。

