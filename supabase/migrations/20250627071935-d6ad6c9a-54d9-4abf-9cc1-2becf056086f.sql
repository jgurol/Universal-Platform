
-- Create table for agent agreements
CREATE TABLE public.agent_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  agreement_data JSONB NOT NULL, -- Store form field data
  digital_signature TEXT NOT NULL, -- Store signature data
  ip_address INET,
  user_agent TEXT,
  agreed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  w9_file_path TEXT, -- Path to uploaded W9 file
  w9_file_name TEXT, -- Original W9 filename
  w9_file_size INTEGER, -- W9 file size in bytes
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for agent agreement tokens (for secure access)
CREATE TABLE public.agent_agreement_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_agent_agreements_agent_id ON public.agent_agreements(agent_id);
CREATE INDEX idx_agent_agreements_status ON public.agent_agreements(status);
CREATE INDEX idx_agent_agreement_tokens_token ON public.agent_agreement_tokens(token);
CREATE INDEX idx_agent_agreement_tokens_expires ON public.agent_agreement_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.agent_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_agreement_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agent agreements (public access for form submission)
CREATE POLICY "Allow public insert for agent agreements" 
  ON public.agent_agreements 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view agent agreements" 
  ON public.agent_agreements 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create RLS policies for tokens (public read for validation)
CREATE POLICY "Allow public select for token validation" 
  ON public.agent_agreement_tokens 
  FOR SELECT 
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can manage tokens" 
  ON public.agent_agreement_tokens 
  FOR ALL 
  TO authenticated
  USING (true);
