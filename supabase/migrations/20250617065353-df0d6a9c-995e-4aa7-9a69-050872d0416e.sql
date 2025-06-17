
-- Create storage bucket for vendor price sheets
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-price-sheets', 'vendor-price-sheets', false);

-- Create storage policies for vendor price sheets
CREATE POLICY "Users can upload their own price sheets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-price-sheets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own price sheets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vendor-price-sheets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own price sheets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-price-sheets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table for vendor price sheet metadata
CREATE TABLE public.vendor_price_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for vendor_price_sheets table
ALTER TABLE public.vendor_price_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own price sheets"
ON public.vendor_price_sheets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own price sheets"
ON public.vendor_price_sheets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price sheets"
ON public.vendor_price_sheets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price sheets"
ON public.vendor_price_sheets FOR DELETE
USING (auth.uid() = user_id);
