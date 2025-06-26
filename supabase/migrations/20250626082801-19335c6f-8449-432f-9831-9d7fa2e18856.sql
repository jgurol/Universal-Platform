
-- Create vendor folders table to organize attachments
CREATE TABLE public.vendor_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_folder_id UUID REFERENCES public.vendor_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendor attachments table
CREATE TABLE public.vendor_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.vendor_folders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for vendor attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-attachments', 'vendor-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for vendor folders
ALTER TABLE public.vendor_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendor folders" ON public.vendor_folders
  FOR SELECT USING (true);

CREATE POLICY "Users can create vendor folders" ON public.vendor_folders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update vendor folders" ON public.vendor_folders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete vendor folders" ON public.vendor_folders
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add RLS policies for vendor attachments
ALTER TABLE public.vendor_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendor attachments" ON public.vendor_attachments
  FOR SELECT USING (true);

CREATE POLICY "Users can create vendor attachments" ON public.vendor_attachments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update vendor attachments" ON public.vendor_attachments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete vendor attachments" ON public.vendor_attachments
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add storage policies for vendor attachments
CREATE POLICY "Users can upload vendor attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'vendor-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view vendor attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'vendor-attachments');

CREATE POLICY "Users can update vendor attachments" ON storage.objects
  FOR UPDATE USING (bucket_id = 'vendor-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete vendor attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'vendor-attachments' AND auth.role() = 'authenticated');

-- Insert default folders for existing vendors
INSERT INTO public.vendor_folders (vendor_id, name)
SELECT id, 'Price Sheets' FROM public.vendors WHERE is_active = true
UNION ALL
SELECT id, 'Brochures' FROM public.vendors WHERE is_active = true;
