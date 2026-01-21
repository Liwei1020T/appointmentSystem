-- Migration: 022_promotions
-- Description: Add promotions and marketing campaign tables
-- Date: 2026-01-21

-- Create PromotionType enum
DO $$ BEGIN
    CREATE TYPE "PromotionType" AS ENUM ('FLASH_SALE', 'POINTS_BOOST', 'SPEND_SAVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create DiscountType enum
DO $$ BEGIN
    CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENTAGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create promotions table
CREATE TABLE IF NOT EXISTS "promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10, 2) NOT NULL,
    "min_purchase" DECIMAL(10, 2),
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- Create promotion_usage table
CREATE TABLE IF NOT EXISTS "promotion_usage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promotion_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "saved_amount" DECIMAL(10, 2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_usage_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for promotion_usage
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS "promotions_is_active_idx" ON "promotions"("is_active");
CREATE INDEX IF NOT EXISTS "promotions_start_at_end_at_idx" ON "promotions"("start_at", "end_at");
CREATE INDEX IF NOT EXISTS "promotion_usage_promotion_id_idx" ON "promotion_usage"("promotion_id");
CREATE INDEX IF NOT EXISTS "promotion_usage_user_id_idx" ON "promotion_usage"("user_id");
