
-- Create table for circuit quote notes
CREATE TABLE public.circuit_quote_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circuit_quote_id UUID NOT NULL REFERENCES public.circuit_quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for circuit quote note files
CREATE TABLE public.circuit_quote_note_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circuit_quote_note_id UUID NOT NULL REFERENCES public.circuit_quote_notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.circuit_quote_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuit_quote_note_files ENABLE ROW LEVEL SECURITY;

-- Create policies for circuit_quote_notes
CREATE POLICY "Users can view circuit quote notes they have access to" 
  ON public.circuit_quote_notes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = circuit_quote_notes.circuit_quote_id 
      AND (
        cq.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() AND p.role = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles p, public.client_info ci
          WHERE p.id = auth.uid() 
          AND p.associated_agent_id IS NOT NULL
          AND ci.id = cq.client_info_id
          AND ci.agent_id = p.associated_agent_id
        )
      )
    )
  );

CREATE POLICY "Users can create circuit quote notes for accessible quotes" 
  ON public.circuit_quote_notes 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = circuit_quote_notes.circuit_quote_id 
      AND (
        cq.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() AND p.role = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles p, public.client_info ci
          WHERE p.id = auth.uid() 
          AND p.associated_agent_id IS NOT NULL
          AND ci.id = cq.client_info_id
          AND ci.agent_id = p.associated_agent_id
        )
      )
    )
  );

CREATE POLICY "Users can update their own circuit quote notes" 
  ON public.circuit_quote_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own circuit quote notes" 
  ON public.circuit_quote_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for circuit_quote_note_files
CREATE POLICY "Users can view files for accessible notes" 
  ON public.circuit_quote_note_files 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quote_notes cqn, public.circuit_quotes cq 
      WHERE cqn.id = circuit_quote_note_files.circuit_quote_note_id 
      AND cq.id = cqn.circuit_quote_id
      AND (
        cq.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p 
          WHERE p.id = auth.uid() AND p.role = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM public.profiles p, public.client_info ci
          WHERE p.id = auth.uid() 
          AND p.associated_agent_id IS NOT NULL
          AND ci.id = cq.client_info_id
          AND ci.agent_id = p.associated_agent_id
        )
      )
    )
  );

CREATE POLICY "Users can create files for accessible notes" 
  ON public.circuit_quote_note_files 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.circuit_quote_notes cqn, public.circuit_quotes cq 
      WHERE cqn.id = circuit_quote_note_files.circuit_quote_note_id 
      AND cq.id = cqn.circuit_quote_id
      AND cqn.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files for their own notes" 
  ON public.circuit_quote_note_files 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quote_notes cqn 
      WHERE cqn.id = circuit_quote_note_files.circuit_quote_note_id 
      AND cqn.user_id = auth.uid()
    )
  );

-- Create storage bucket for circuit quote files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('circuit-quote-files', 'circuit-quote-files', true);

-- Create storage policies
CREATE POLICY "Users can upload circuit quote files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'circuit-quote-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view circuit quote files" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'circuit-quote-files');

CREATE POLICY "Users can delete their own circuit quote files" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'circuit-quote-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add indexes for better performance
CREATE INDEX idx_circuit_quote_notes_circuit_quote_id ON public.circuit_quote_notes(circuit_quote_id);
CREATE INDEX idx_circuit_quote_notes_user_id ON public.circuit_quote_notes(user_id);
CREATE INDEX idx_circuit_quote_note_files_note_id ON public.circuit_quote_note_files(circuit_quote_note_id);
