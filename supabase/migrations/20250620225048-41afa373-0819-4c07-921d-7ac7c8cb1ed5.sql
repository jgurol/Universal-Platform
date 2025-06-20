
-- Create a table for deal registrations
CREATE TABLE public.deal_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.agents(id),
  client_info_id UUID REFERENCES public.client_info(id),
  deal_name TEXT NOT NULL,
  deal_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  expected_close_date DATE,
  probability INTEGER CHECK (probability >= 0 AND probability <= 100) DEFAULT 50,
  stage TEXT NOT NULL DEFAULT 'prospecting',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active'
);

-- Add Row Level Security (RLS)
ALTER TABLE public.deal_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for deal registrations
CREATE POLICY "Users can view their own deal registrations" 
  ON public.deal_registrations 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = deal_registrations.agent_id
    ))
  );

CREATE POLICY "Users can create their own deal registrations" 
  ON public.deal_registrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deal registrations" 
  ON public.deal_registrations 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = deal_registrations.agent_id
    ))
  );

CREATE POLICY "Users can delete their own deal registrations" 
  ON public.deal_registrations 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = deal_registrations.agent_id
    ))
  );

-- Add index for better performance
CREATE INDEX idx_deal_registrations_user_id ON public.deal_registrations(user_id);
CREATE INDEX idx_deal_registrations_agent_id ON public.deal_registrations(agent_id);
CREATE INDEX idx_deal_registrations_client_info_id ON public.deal_registrations(client_info_id);
