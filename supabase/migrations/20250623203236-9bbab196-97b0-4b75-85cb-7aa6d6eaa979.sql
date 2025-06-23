
-- Update the client_info RLS policies to allow admins to see all client records
-- First, drop the existing select policy
DROP POLICY IF EXISTS "client_info_select_policy" ON public.client_info;

-- Create a new select policy that allows admins to see all records
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
    OR
    (public.get_current_user_role() = 'admin')
  );

-- Also update the circuit_quotes RLS policies to allow admins to manage all circuit quotes
-- Drop existing policies for circuit_quotes
DROP POLICY IF EXISTS "Users can view their own circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Users can create their own circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Users can update their own circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Users can delete their own circuit quotes" ON public.circuit_quotes;

-- Create new policies that include admin access
CREATE POLICY "Users can view circuit quotes" 
  ON public.circuit_quotes 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can create circuit quotes" 
  ON public.circuit_quotes 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can update circuit quotes" 
  ON public.circuit_quotes 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can delete circuit quotes" 
  ON public.circuit_quotes 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR 
    public.get_current_user_role() = 'admin'
  );

-- Also update carrier_quotes policies to allow admins
DROP POLICY IF EXISTS "Users can view carrier quotes for their circuit quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Users can create carrier quotes for their circuit quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Users can update carrier quotes for their circuit quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Users can delete carrier quotes for their circuit quotes" ON public.carrier_quotes;

CREATE POLICY "Users can view carrier quotes" 
  ON public.carrier_quotes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = carrier_quotes.circuit_quote_id 
      AND (cq.user_id = auth.uid() OR public.get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Users can create carrier quotes" 
  ON public.carrier_quotes 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = carrier_quotes.circuit_quote_id 
      AND (cq.user_id = auth.uid() OR public.get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Users can update carrier quotes" 
  ON public.carrier_quotes 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = carrier_quotes.circuit_quote_id 
      AND (cq.user_id = auth.uid() OR public.get_current_user_role() = 'admin')
    )
  );

CREATE POLICY "Users can delete carrier quotes" 
  ON public.carrier_quotes 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.circuit_quotes cq 
      WHERE cq.id = carrier_quotes.circuit_quote_id 
      AND (cq.user_id = auth.uid() OR public.get_current_user_role() = 'admin')
    )
  );
