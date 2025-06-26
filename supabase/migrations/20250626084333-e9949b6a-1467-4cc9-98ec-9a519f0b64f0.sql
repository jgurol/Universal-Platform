
-- Add is_public column to vendor_attachments table
ALTER TABLE public.vendor_attachments 
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Update RLS policies for vendor_attachments to handle public/private visibility
DROP POLICY IF EXISTS "Users can view vendor attachments" ON public.vendor_attachments;

-- Create new policy for viewing attachments based on role and public status
CREATE POLICY "Users can view vendor attachments based on role and public status" 
ON public.vendor_attachments 
FOR SELECT 
USING (
  -- Admins can see all attachments
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
  -- Non-admins can only see public attachments
  (is_public = true AND auth.role() = 'authenticated')
);

-- Update folder policies to be consistent
DROP POLICY IF EXISTS "Users can view vendor folders" ON public.vendor_folders;

CREATE POLICY "Users can view vendor folders based on role" 
ON public.vendor_folders 
FOR SELECT 
USING (
  -- Admins can see all folders
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
  -- Non-admins can see folders that contain public attachments or are empty
  (
    auth.role() = 'authenticated' AND
    (
      -- Folder has public attachments
      EXISTS (
        SELECT 1 FROM public.vendor_attachments 
        WHERE folder_id = vendor_folders.id AND is_public = true
      ) OR
      -- Folder has no attachments (empty folder)
      NOT EXISTS (
        SELECT 1 FROM public.vendor_attachments 
        WHERE folder_id = vendor_folders.id
      )
    )
  )
);
