
-- First, let's ensure the storage bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-price-sheets', 'vendor-price-sheets', false)
ON CONFLICT (id) DO NOTHING;

-- Update storage policies to allow proper access
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view price sheet files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload price sheet files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete price sheet files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own price sheets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own price sheets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own price sheets" ON storage.objects;

-- Create comprehensive policies for the storage bucket
-- Policy 1: Users can view files they uploaded or public files
CREATE POLICY "Users can view price sheet files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'vendor-price-sheets' AND (
    -- Users can see their own files
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Or files that are marked as public in the database
    EXISTS (
      SELECT 1 FROM public.vendor_price_sheets 
      WHERE file_path = name AND is_public = true
    )
  )
);

-- Policy 2: Users can upload to their own folder
CREATE POLICY "Users can upload price sheet files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vendor-price-sheets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own files
CREATE POLICY "Users can delete price sheet files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vendor-price-sheets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can update their own files
CREATE POLICY "Users can update price sheet files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'vendor-price-sheets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
