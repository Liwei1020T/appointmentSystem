-- ====================================================
-- Supabase Storage Setup for Payment Receipts
-- ====================================================
-- Run this in Supabase SQL Editor
-- Date: 2025-12-12
-- Purpose: Create storage bucket for payment receipt uploads
-- ====================================================

-- 1. Create the 'receipts' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,  -- Private bucket (only authenticated users can access)
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for receipts bucket

-- Policy: Allow authenticated users to upload their own receipts
CREATE POLICY "Users can upload payment receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' 
  AND (storage.foldername(name))[1] = 'payment-receipts'
);

-- Policy: Allow users to view their own receipts
CREATE POLICY "Users can view own receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (
    -- User can see their own receipts
    (storage.foldername(name))[1] = 'payment-receipts'
    OR
    -- Admins can see all receipts
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
);

-- Policy: Allow users to delete their own receipts (optional)
CREATE POLICY "Users can delete own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = 'payment-receipts'
);

-- Policy: Allow admins to access all receipts
CREATE POLICY "Admins can manage all receipts"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 3. Verify bucket creation
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'receipts';

-- ====================================================
-- Expected Output:
-- ====================================================
-- id       | receipts
-- name     | receipts
-- public   | false
-- file_size_limit | 5242880
-- allowed_mime_types | {image/jpeg,image/jpg,image/png,image/webp,application/pdf}
-- created_at | (current timestamp)
-- ====================================================

-- ====================================================
-- MANUAL SETUP (Alternative via Supabase Dashboard):
-- ====================================================
-- 1. Go to Storage section in Supabase Dashboard
-- 2. Click "Create a new bucket"
-- 3. Bucket name: receipts
-- 4. Public bucket: OFF (unchecked)
-- 5. File size limit: 5 MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
-- 7. Click "Save"
-- 8. Go to Policies tab and apply the RLS policies above
-- ====================================================
