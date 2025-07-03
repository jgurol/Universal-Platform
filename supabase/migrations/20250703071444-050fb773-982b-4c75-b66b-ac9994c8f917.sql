-- Create table for deal registration notes
CREATE TABLE IF NOT EXISTS public.deal_registration_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_registration_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_registration_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for deal registration notes
CREATE POLICY "Users can view notes for accessible deals" 
ON public.deal_registration_notes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.deal_registrations dr
    WHERE dr.id = deal_registration_notes.deal_registration_id
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

CREATE POLICY "Users can create notes for accessible deals" 
ON public.deal_registration_notes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.deal_registrations dr
    WHERE dr.id = deal_registration_notes.deal_registration_id
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

CREATE POLICY "Users can update their own notes" 
ON public.deal_registration_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.deal_registration_notes 
FOR DELETE 
USING (auth.uid() = user_id);