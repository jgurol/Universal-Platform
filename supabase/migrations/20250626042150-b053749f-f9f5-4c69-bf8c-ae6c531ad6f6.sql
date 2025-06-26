
-- Drop existing policies for client_contacts
DROP POLICY IF EXISTS "Users can view contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can create contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can update contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can delete contacts for their clients" ON public.client_contacts;

-- Create simplified policies that focus on direct ownership first
CREATE POLICY "Users can view contacts for their clients" 
  ON public.client_contacts 
  FOR SELECT 
  USING (
    client_info_id IN (
      SELECT id FROM public.client_info 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contacts for their clients" 
  ON public.client_contacts 
  FOR INSERT 
  WITH CHECK (
    client_info_id IN (
      SELECT id FROM public.client_info 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts for their clients" 
  ON public.client_contacts 
  FOR UPDATE 
  USING (
    client_info_id IN (
      SELECT id FROM public.client_info 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts for their clients" 
  ON public.client_contacts 
  FOR DELETE 
  USING (
    client_info_id IN (
      SELECT id FROM public.client_info 
      WHERE user_id = auth.uid()
    )
  );
