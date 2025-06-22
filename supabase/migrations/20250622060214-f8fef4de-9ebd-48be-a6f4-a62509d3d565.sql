
-- Drop existing policies and recreate them with simpler logic
DROP POLICY IF EXISTS "Users can view price sheet files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload price sheet files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete price sheet files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update price sheet files" ON storage.objects;

-- Policy 1: Admins can view all files, users can view their own files and public files
CREATE POLICY "Users can view price sheet files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'vendor-price-sheets' AND (
    -- Admins can see all files
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
    -- Users can see their own files
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Or public files (check without subquery to avoid RLS issues)
    name IN (
      SELECT file_path FROM public.vendor_price_sheets 
      WHERE is_public = true
    )
  )
);

-- Policy 2: Users can upload to their own folder
CREATE POLICY "Users can upload price sheet files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vendor-price-sheets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete their own files, admins can delete any
CREATE POLICY "Users can delete price sheet files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vendor-price-sheets' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
);

-- Policy 4: Users can update their own files, admins can update any
CREATE POLICY "Users can update price sheet files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'vendor-price-sheets' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
);
