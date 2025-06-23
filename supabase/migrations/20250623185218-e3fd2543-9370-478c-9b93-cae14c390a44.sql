
-- Enable RLS on quote_acceptances table if not already enabled
ALTER TABLE public.quote_acceptances ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert quote acceptances (for public quote acceptance)
CREATE POLICY "Allow public quote acceptance insertions" 
  ON public.quote_acceptances 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to view quote acceptances (needed for checking duplicates)
CREATE POLICY "Allow public quote acceptance reads" 
  ON public.quote_acceptances 
  FOR SELECT 
  USING (true);
