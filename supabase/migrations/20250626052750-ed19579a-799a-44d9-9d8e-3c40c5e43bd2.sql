
-- Create table for deal registration notes
CREATE TABLE public.deal_registration_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_registration_id UUID NOT NULL REFERENCES public.deal_registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for deal registration note files
CREATE TABLE public.deal_registration_note_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_registration_note_id UUID NOT NULL REFERENCES public.deal_registration_notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own notes
ALTER TABLE public.deal_registration_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_registration_note_files ENABLE ROW LEVEL SECURITY;

-- Create policies for deal_registration_notes
CREATE POLICY "Users can view deal registration notes" 
  ON public.deal_registration_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create deal registration notes" 
  ON public.deal_registration_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deal registration notes" 
  ON public.deal_registration_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deal registration notes" 
  ON public.deal_registration_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for deal_registration_note_files
CREATE POLICY "Users can view deal registration note files" 
  ON public.deal_registration_note_files 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_registration_notes 
      WHERE id = deal_registration_note_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create deal registration note files" 
  ON public.deal_registration_note_files 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deal_registration_notes 
      WHERE id = deal_registration_note_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update deal registration note files" 
  ON public.deal_registration_note_files 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_registration_notes 
      WHERE id = deal_registration_note_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete deal registration note files" 
  ON public.deal_registration_note_files 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_registration_notes 
      WHERE id = deal_registration_note_id 
      AND user_id = auth.uid()
    )
  );

-- Create storage bucket for deal registration files
INSERT INTO storage.buckets (id, name, public) VALUES ('deal-registration-files', 'deal-registration-files', true);

-- Create storage policies
CREATE POLICY "Users can upload deal registration files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'deal-registration-files');

CREATE POLICY "Users can view deal registration files" ON storage.objects
  FOR SELECT USING (bucket_id = 'deal-registration-files');

CREATE POLICY "Users can delete deal registration files" ON storage.objects
  FOR DELETE USING (bucket_id = 'deal-registration-files');
