
-- First, let's check the current RLS policies for client_info and fix them
-- Drop the existing select policy to recreate it properly
DROP POLICY IF EXISTS "client_info_select_policy" ON public.client_info;

-- Create a comprehensive select policy that allows:
-- 1. Users to see their own client records
-- 2. Users to see clients assigned to their associated agent
-- 3. Admins to see all client records
CREATE POLICY "client_info_select_policy" 
  ON public.client_info 
  FOR SELECT 
  USING (
    -- User owns the record
    auth.uid() = user_id 
    OR 
    -- User is associated with the agent assigned to this client
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = client_info.agent_id
    ))
    OR
    -- User is an admin (can see all records)
    (public.get_current_user_role() = 'admin')
  );

-- Also ensure admins can insert circuit quotes for any client
DROP POLICY IF EXISTS "Users can create circuit quotes" ON public.circuit_quotes;

CREATE POLICY "Users can create circuit quotes" 
  ON public.circuit_quotes 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    public.get_current_user_role() = 'admin'
  );
