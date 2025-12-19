-- Phone OTP Auth Migration
-- Purpose:
-- - Allow phone-only authentication (方案B) by making `users.email` and `users.password` optional
-- - Add `otp_codes` table for SMS OTP login/signup
--
-- Notes:
-- - This project also uses Prisma `db push`; keep this SQL as a portable migration plan.
-- - If your database does not have `gen_random_uuid()`, enable pgcrypto:
--   CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Relax constraints for email/password (email-less + password-less accounts)
ALTER TABLE IF EXISTS users
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN password DROP NOT NULL;

-- 2) Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  purpose text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  expires_at timestamptz NOT NULL,
  ip text,
  user_agent text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT otp_codes_phone_purpose_key UNIQUE (phone, purpose)
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes (expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at ON otp_codes (created_at);

