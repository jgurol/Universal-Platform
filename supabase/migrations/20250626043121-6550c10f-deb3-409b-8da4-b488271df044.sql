
-- Drop existing policies for client_contacts
DROP POLICY IF EXISTS "Users can view contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can create contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can update contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can delete contacts for their clients" ON public.client_contacts;

-- Create comprehensive policies that include direct ownership, agent relationships, AND admin access
CREATE POLICY "Users can view contacts for their clients" 
  ON public.client_contacts 
  FOR SELECT 
  USING (
    -- Direct ownership
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR 
    -- Agent relationship
    EXISTS (
      SELECT 1 FROM public.client_info ci
      JOIN public.profiles p ON p.associated_agent_id = ci.agent_id
      WHERE ci.id = client_contacts.client_info_id 
      AND p.id = auth.uid()
    )
    OR
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create contacts for their clients" 
  ON public.client_contacts 
  FOR INSERT 
  WITH CHECK (
    -- Direct ownership
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR 
    -- Agent relationship
    EXISTS (
      SELECT 1 FROM public.client_info ci
      JOIN public.profiles p ON p.associated_agent_id = ci.agent_id
      WHERE ci.id = client_contacts.client_info_id 
      AND p.id = auth.uid()
    )
    OR
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update contacts for their clients" 
  ON public.client_contacts 
  FOR UPDATE 
  USING (
    -- Direct ownership
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR 
    -- Agent relationship
    EXISTS (
      SELECT 1 FROM public.client_info ci
      JOIN public.profiles p ON p.associated_agent_id = ci.agent_id
      WHERE ci.id = client_contacts.client_info_id 
      AND p.id = auth.uid()
    )
    OR
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete contacts for their clients" 
  ON public.client_contacts 
  FOR DELETE 
  USING (
    -- Direct ownership
    EXISTS (
      SELECT 1 FROM public.client_info 
      WHERE client_info.id = client_contacts.client_info_id 
      AND client_info.user_id = auth.uid()
    )
    OR 
    -- Agent relationship
    EXISTS (
      SELECT 1 FROM public.client_info ci
      JOIN public.profiles p ON p.associated_agent_id = ci.agent_id
      WHERE ci.id = client_contacts.client_info_id 
      AND p.id = auth.uid()
    )
    OR
    -- Admin access
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
