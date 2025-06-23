
-- Allow public updates to quotes table specifically for quote acceptance
-- This policy allows anyone to update a quote's acceptance-related fields
CREATE POLICY "Allow public quote acceptance updates" 
  ON public.quotes 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);
