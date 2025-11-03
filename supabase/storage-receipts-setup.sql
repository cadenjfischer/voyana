-- ============================================
-- Complete Supabase Storage Setup for Receipts
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;

-- Step 2: Delete the bucket if it exists (this will delete all files in it!)
DELETE FROM storage.buckets WHERE id = 'receipts';

-- Step 3: Create a fresh PUBLIC bucket for receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts', 
  'receipts', 
  true,  -- PUBLIC bucket so images can be displayed
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
);

-- Step 4: Policy - Allow authenticated users to upload their own receipts
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 5: Policy - Allow anyone to view receipts (public bucket)
CREATE POLICY "Public receipts are viewable by anyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');

-- Step 6: Policy - Allow users to delete only their own receipts
CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 7: Policy - Allow users to update only their own receipts
CREATE POLICY "Users can update their own receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Setup Complete!
-- ============================================
