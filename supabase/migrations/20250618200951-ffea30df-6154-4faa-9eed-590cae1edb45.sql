
-- Create table for carrier quote notes
CREATE TABLE public.carrier_quote_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_quote_id UUID NOT NULL REFERENCES public.carrier_quotes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for carrier quote note files
CREATE TABLE public.carrier_quote_note_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_quote_note_id UUID NOT NULL REFERENCES public.carrier_quote_notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.carrier_quote_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_quote_note_files ENABLE ROW LEVEL SECURITY;

-- Create policies for carrier_quote_notes
CREATE POLICY "Users can view notes for their carrier quotes" 
  ON public.carrier_quote_notes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.carrier_quotes cq
      JOIN public.circuit_quotes q ON cq.circuit_quote_id = q.id
      WHERE cq.id = carrier_quote_notes.carrier_quote_id 
      AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes for their carrier quotes" 
  ON public.carrier_quote_notes 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.carrier_quotes cq
      JOIN public.circuit_quotes q ON cq.circuit_quote_id = q.id
      WHERE cq.id = carrier_quote_notes.carrier_quote_id 
      AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notes" 
  ON public.carrier_quote_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
  ON public.carrier_quote_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for carrier_quote_note_files
CREATE POLICY "Users can view files for their notes" 
  ON public.carrier_quote_note_files 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.carrier_quote_notes n
      JOIN public.carrier_quotes cq ON n.carrier_quote_id = cq.id
      JOIN public.circuit_quotes q ON cq.circuit_quote_id = q.id
      WHERE n.id = carrier_quote_note_files.carrier_quote_note_id 
      AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files for their notes" 
  ON public.carrier_quote_note_files 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carrier_quote_notes n
      JOIN public.carrier_quotes cq ON n.carrier_quote_id = cq.id
      JOIN public.circuit_quotes q ON cq.circuit_quote_id = q.id
      WHERE n.id = carrier_quote_note_files.carrier_quote_note_id 
      AND q.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files from their notes" 
  ON public.carrier_quote_note_files 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.carrier_quote_notes n
      JOIN public.carrier_quotes cq ON n.carrier_quote_id = cq.id
      JOIN public.circuit_quotes q ON cq.circuit_quote_id = q.id
      WHERE n.id = carrier_quote_note_files.carrier_quote_note_id 
      AND q.user_id = auth.uid()
    )
  );

-- Create storage bucket for carrier quote files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('carrier-quote-files', 'carrier-quote-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload files for their carrier quotes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'carrier-quote-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view files for their carrier quotes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'carrier-quote-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete files for their carrier quotes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'carrier-quote-files' AND
  auth.role() = 'authenticated'
);
