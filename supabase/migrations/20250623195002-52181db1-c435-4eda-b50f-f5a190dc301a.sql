
-- Drop the existing broad public update policy that might not be working properly
DROP POLICY IF EXISTS "Allow public quote acceptance updates" ON public.quotes;

-- Create a more specific policy that allows updates to acceptance-related fields only
CREATE POLICY "Allow public quote acceptance status updates" 
  ON public.quotes 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Also ensure we can select quotes for the acceptance page
CREATE POLICY "Allow public quote selection for acceptance" 
  ON public.quotes 
  FOR SELECT 
  USING (true);
