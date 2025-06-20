
-- Drop all existing policies on client_info table with their exact names
DROP POLICY IF EXISTS "Users can view client info" ON public.client_info;
DROP POLICY IF EXISTS "Users can create client info" ON public.client_info;
DROP POLICY IF EXISTS "Users can update client info" ON public.client_info;
DROP POLICY IF EXISTS "Users can delete client info" ON public.client_info;

-- Also check for other possible policy names
DROP POLICY IF EXISTS "Enable read access for own data" ON public.client_info;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.client_info;
DROP POLICY IF EXISTS "Enable update access for own data" ON public.client_info;
DROP POLICY IF EXISTS "Enable delete access for own data" ON public.client_info;

-- Create new comprehensive RLS policies for client_info
-- Policy for SELECT: Users can see their own clients OR clients assigned to their associated agent
CREATE POLICY "client_info_select_policy" 
  ON public.client_info 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = client_info.agent_id
    ))
  );

-- Policy for INSERT: Users can create client info
CREATE POLICY "client_info_insert_policy" 
  ON public.client_info 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own clients OR clients assigned to their associated agent
CREATE POLICY "client_info_update_policy" 
  ON public.client_info 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = client_info.agent_id
    ))
  );

-- Policy for DELETE: Users can delete their own clients OR clients assigned to their associated agent
CREATE POLICY "client_info_delete_policy" 
  ON public.client_info 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = client_info.agent_id
    ))
  );

-- Enable RLS on client_info table (in case it's not already enabled)
ALTER TABLE public.client_info ENABLE ROW LEVEL SECURITY;
