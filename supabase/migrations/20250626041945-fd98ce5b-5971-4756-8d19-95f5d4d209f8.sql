
-- Drop existing policies for client_contacts
DROP POLICY IF EXISTS "Users can view contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can create contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can update contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can delete contacts for their clients" ON public.client_contacts;

-- Create new, simplified policies for client_contacts
CREATE POLICY "Users can view contacts for their clients" 
  ON public.client_contacts 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.client_info ci
      JOIN public.profiles p ON p.associated_agent_id = ci.agent_id
      WHERE ci.id = client_contacts.client_info_id 
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create contacts for their clients" 
  ON public.client_contacts 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.client_info ci
      JOIN public.profiles p ON p.associated_agent_id = ci.agent_id
      WHERE ci.id = client_contacts.client_info_id 
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts for their clients" 
  ON public.client_contacts 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.client_info ci
      JOIN public.profiles p ON p.associated_agent_id = ci.agent_id
      WHERE ci.id = client_contacts.client_info_id 
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts for their clients" 
  ON public.client_contacts 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.client_info ci
      JOIN public.profiles p ON p.associated_agent_id = ci.agent_id
      WHERE ci.id = client_contacts.client_info_id 
      AND p.id = auth.uid()
    )
  );
