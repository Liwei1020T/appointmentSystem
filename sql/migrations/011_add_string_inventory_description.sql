-- Add description column to string_inventory to match Prisma schema
ALTER TABLE string_inventory
ADD COLUMN IF NOT EXISTS description TEXT;
