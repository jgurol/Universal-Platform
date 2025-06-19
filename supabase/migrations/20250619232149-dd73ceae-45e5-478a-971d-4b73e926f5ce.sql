
-- Update RLS policies to allow users to view all circuit quotes, not just their own
DROP POLICY IF EXISTS "Users can view their own circuit quotes" ON public.circuit_quotes;
DROP POLICY IF EXISTS "Admins can view all circuit quotes" ON public.circuit_quotes;

CREATE POLICY "Users can view all circuit quotes" 
  ON public.circuit_quotes 
  FOR SELECT 
  USING (true);

-- Update RLS policies to allow users to view all carrier quotes, not just their own
DROP POLICY IF EXISTS "Users can view carrier quotes for their circuit quotes" ON public.carrier_quotes;
DROP POLICY IF EXISTS "Admins can view all carrier quotes" ON public.carrier_quotes;

CREATE POLICY "Users can view all carrier quotes" 
  ON public.carrier_quotes 
  FOR SELECT 
  USING (true);

-- Keep the existing INSERT, UPDATE, DELETE policies unchanged so users can only modify their own data
-- This ensures data security while allowing read access to all circuit quotes
