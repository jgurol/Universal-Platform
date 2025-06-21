
-- Update the vendors table RLS policy to allow agents to view all vendors
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own vendors, admins can view all" ON public.vendors;

-- Create new policy that allows users to view all vendors (not just their own)
-- while still maintaining the admin privilege for management operations
CREATE POLICY "Users can view all vendors" 
  ON public.vendors 
  FOR SELECT 
  USING (true);

-- Keep the existing policies for create/update/delete operations unchanged
-- so users can still only manage their own vendors, but can view all vendors
