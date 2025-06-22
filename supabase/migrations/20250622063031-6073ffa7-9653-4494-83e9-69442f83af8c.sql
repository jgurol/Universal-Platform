
-- Update the client_contacts table structure to match the TypeScript interface
ALTER TABLE public.client_contacts 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS role;

ALTER TABLE public.client_contacts 
ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS title TEXT;

-- Update the RLS policies to use the correct column names
DROP POLICY IF EXISTS "Users can view contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can create contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can update contacts for their clients" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can delete contacts for their clients" ON public.client_contacts;

CREATE POLICY "Users can view contacts for their clients" 
  ON public.client_contacts 
  FOR SELECT 
  USING (
    client_info_id IN (
      SELECT id FROM public.client_info 
      WHERE user_id = auth.uid() 
      OR (auth.uid() IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.associated_agent_id = client_info.agent_id
      ))
    )
  );

CREATE POLICY "Users can create contacts for their clients" 
  ON public.client_contacts 
  FOR INSERT 
  WITH CHECK (
    client_info_id IN (
      SELECT id FROM public.client_info 
      WHERE user_id = auth.uid() 
      OR (auth.uid() IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.associated_agent_id = client_info.agent_id
      ))
    )
  );

CREATE POLICY "Users can update contacts for their clients" 
  ON public.client_contacts 
  FOR UPDATE 
  USING (
    client_info_id IN (
      SELECT id FROM public.client_info 
      WHERE user_id = auth.uid() 
      OR (auth.uid() IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.associated_agent_id = client_info.agent_id
      ))
    )
  );

CREATE POLICY "Users can delete contacts for their clients" 
  ON public.client_contacts 
  FOR DELETE 
  USING (
    client_info_id IN (
      SELECT id FROM public.client_info 
      WHERE user_id = auth.uid() 
      OR (auth.uid() IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.associated_agent_id = client_info.agent_id
      ))
    )
  );
