
-- Create table for LNP porting requests
CREATE TABLE public.lnp_porting_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  client_info_id UUID REFERENCES public.client_info(id),
  status TEXT NOT NULL DEFAULT 'pending',
  current_carrier TEXT NOT NULL,
  account_number TEXT,
  billing_phone_number TEXT,
  authorized_contact_name TEXT NOT NULL,
  authorized_contact_title TEXT,
  business_name TEXT NOT NULL,
  service_address TEXT NOT NULL,
  billing_address TEXT,
  phone_bill_file_path TEXT,
  phone_bill_file_name TEXT,
  signature_data TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create table for individual numbers to be ported
CREATE TABLE public.lnp_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lnp_porting_request_id UUID NOT NULL REFERENCES public.lnp_porting_requests(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  current_service_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.lnp_porting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lnp_numbers ENABLE ROW LEVEL SECURITY;

-- RLS policies for lnp_porting_requests
CREATE POLICY "Users can view their own LNP requests" 
  ON public.lnp_porting_requests 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id IN (
        SELECT ci.agent_id FROM public.client_info ci 
        WHERE ci.id = lnp_porting_requests.client_info_id
      )
    ))
  );

CREATE POLICY "Users can create their own LNP requests" 
  ON public.lnp_porting_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LNP requests" 
  ON public.lnp_porting_requests 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id IN (
        SELECT ci.agent_id FROM public.client_info ci 
        WHERE ci.id = lnp_porting_requests.client_info_id
      )
    ))
  );

-- RLS policies for lnp_numbers
CREATE POLICY "Users can view LNP numbers for their requests" 
  ON public.lnp_numbers 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.lnp_porting_requests lpr 
      WHERE lpr.id = lnp_numbers.lnp_porting_request_id 
      AND (
        lpr.user_id = auth.uid() 
        OR 
        auth.uid() IN (
          SELECT p.id FROM public.profiles p 
          WHERE p.associated_agent_id IN (
            SELECT ci.agent_id FROM public.client_info ci 
            WHERE ci.id = lpr.client_info_id
          )
        )
      )
    )
  );

CREATE POLICY "Users can create LNP numbers for their requests" 
  ON public.lnp_numbers 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lnp_porting_requests lpr 
      WHERE lpr.id = lnp_numbers.lnp_porting_request_id 
      AND lpr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update LNP numbers for their requests" 
  ON public.lnp_numbers 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.lnp_porting_requests lpr 
      WHERE lpr.id = lnp_numbers.lnp_porting_request_id 
      AND lpr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete LNP numbers for their requests" 
  ON public.lnp_numbers 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.lnp_porting_requests lpr 
      WHERE lpr.id = lnp_numbers.lnp_porting_request_id 
      AND lpr.user_id = auth.uid()
    )
  );

-- Add the new app to the apps table
INSERT INTO public.apps (name, description, route, icon_name, color, display_order) 
VALUES (
  'LNP Porting Process', 
  'Manage Local Number Portability requests and LOA forms', 
  '/lnp-porting', 
  'PhoneCall', 
  '#8B5CF6', 
  7
);

-- Create indexes for better performance
CREATE INDEX idx_lnp_porting_requests_user_id ON public.lnp_porting_requests(user_id);
CREATE INDEX idx_lnp_porting_requests_client_info_id ON public.lnp_porting_requests(client_info_id);
CREATE INDEX idx_lnp_porting_requests_status ON public.lnp_porting_requests(status);
CREATE INDEX idx_lnp_numbers_lnp_porting_request_id ON public.lnp_numbers(lnp_porting_request_id);
