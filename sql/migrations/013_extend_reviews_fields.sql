-- Extend reviews table to support detailed ratings, tags, anonymity, and admin replies.
-- This migration is idempotent and safe to re-run.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS speed_rating INTEGER CHECK (speed_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS admin_reply_by UUID;

