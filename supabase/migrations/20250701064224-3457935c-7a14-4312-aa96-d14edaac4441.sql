
-- Add the new DID Management app to the apps table
INSERT INTO public.apps (name, description, route, icon_name, color, display_order) VALUES
  ('DID Management', 'Manage DID numbers inventory for VOIP system', '/did-management', 'Users', '#059669', 7);

-- Create table for DID numbers inventory
CREATE TABLE public.did_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  did_number TEXT NOT NULL UNIQUE,
  client_info_id UUID REFERENCES public.client_info(id),
  status TEXT NOT NULL DEFAULT 'available',
  assigned_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure DID number is exactly 10 digits
  CONSTRAINT valid_did_number CHECK (did_number ~ '^[0-9]{10}$')
);

-- Add Row Level Security (RLS) for did_numbers
ALTER TABLE public.did_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies for DID numbers
CREATE POLICY "Users can view their own DID numbers" 
  ON public.did_numbers 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own DID numbers" 
  ON public.did_numbers 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DID numbers" 
  ON public.did_numbers 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DID numbers" 
  ON public.did_numbers 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_did_numbers_user_id ON public.did_numbers(user_id);
CREATE INDEX idx_did_numbers_status ON public.did_numbers(status);
CREATE INDEX idx_did_numbers_client_info_id ON public.did_numbers(client_info_id);
