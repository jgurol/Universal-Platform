-- Create table for deal registration documents
CREATE TABLE IF NOT EXISTS public.deal_registration_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_registration_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_registration_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for deal registration documents
CREATE POLICY "Users can view documents for accessible deals" 
ON public.deal_registration_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.deal_registrations dr
    WHERE dr.id = deal_registration_documents.deal_registration_id
    AND (
      dr.user_id = auth.uid() 
      OR auth.uid() IN (
        SELECT p.id FROM profiles p 
        WHERE p.associated_agent_id = dr.agent_id 
        AND p.associated_agent_id IS NOT NULL
      )
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  )
);

CREATE POLICY "Users can upload documents for accessible deals" 
ON public.deal_registration_documents 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by
  AND EXISTS (
    SELECT 1 FROM public.deal_registrations dr
    WHERE dr.id = deal_registration_documents.deal_registration_id
    AND (
      dr.user_id = auth.uid() 
      OR auth.uid() IN (
        SELECT p.id FROM profiles p 
        WHERE p.associated_agent_id = dr.agent_id 
        AND p.associated_agent_id IS NOT NULL
      )
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  )
);

CREATE POLICY "Users can delete documents for accessible deals" 
ON public.deal_registration_documents 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.deal_registrations dr
    WHERE dr.id = deal_registration_documents.deal_registration_id
    AND (
      dr.user_id = auth.uid() 
      OR auth.uid() IN (
        SELECT p.id FROM profiles p 
        WHERE p.associated_agent_id = dr.agent_id 
        AND p.associated_agent_id IS NOT NULL
      )
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  )
);

-- Create storage policies for deal registration files bucket (should already exist)
DO $$ 
BEGIN
  -- Check if policies already exist before creating them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload deal registration files'
  ) THEN
    CREATE POLICY "Users can upload deal registration files" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'deal-registration-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can view deal registration files'
  ) THEN
    CREATE POLICY "Users can view deal registration files" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'deal-registration-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete deal registration files'
  ) THEN
    CREATE POLICY "Users can delete deal registration files" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'deal-registration-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;