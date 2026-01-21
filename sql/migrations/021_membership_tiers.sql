-- Migration: 021_membership_tiers
-- Description: Add membership tier system tables and fields
-- Date: 2026-01-21

-- Create MembershipTier enum
DO $$ BEGIN
    CREATE TYPE "MembershipTier" AS ENUM ('SILVER', 'GOLD', 'VIP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter users table to add membership fields
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "membership_tier" "MembershipTier" NOT NULL DEFAULT 'SILVER',
ADD COLUMN IF NOT EXISTS "total_spent" DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_orders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "tier_updated_at" TIMESTAMPTZ(6);

-- Create tier_benefits table
CREATE TABLE IF NOT EXISTS "tier_benefits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tier" "MembershipTier" NOT NULL,
    "benefit_type" TEXT NOT NULL,
    "benefit_value" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tier_benefits_pkey" PRIMARY KEY ("id")
);

-- Create indexes for tier_benefits
CREATE INDEX IF NOT EXISTS "tier_benefits_tier_idx" ON "tier_benefits"("tier");
CREATE INDEX IF NOT EXISTS "tier_benefits_is_active_idx" ON "tier_benefits"("is_active");
