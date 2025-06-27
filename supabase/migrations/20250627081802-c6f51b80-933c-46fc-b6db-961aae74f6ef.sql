
-- Allow public read access to agents table for agent agreement functionality
CREATE POLICY "Allow public read for agent agreements" 
  ON public.agents 
  FOR SELECT 
  TO anon
  USING (true);

-- Also ensure authenticated users can still access agents
CREATE POLICY "Authenticated users can view agents" 
  ON public.agents 
  FOR SELECT 
  TO authenticated
  USING (true);
