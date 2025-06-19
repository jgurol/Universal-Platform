
-- Add RLS policies for client_addresses table to allow users to manage addresses
CREATE POLICY "Users can view client addresses" 
  ON public.client_addresses 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create client addresses" 
  ON public.client_addresses 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update client addresses" 
  ON public.client_addresses 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete client addresses" 
  ON public.client_addresses 
  FOR DELETE 
  USING (true);
