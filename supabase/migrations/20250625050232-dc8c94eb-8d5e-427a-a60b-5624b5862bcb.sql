
-- Check current RLS policies on quote_acceptances table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'quote_acceptances';

-- Add RLS policy to allow admins to delete quote acceptances
CREATE POLICY "Admins can delete quote acceptances" 
  ON public.quote_acceptances 
  FOR DELETE 
  USING (public.get_current_user_role() = 'admin');

-- Add RLS policy to allow users to delete quote acceptances for their own quotes
CREATE POLICY "Users can delete acceptances for their quotes" 
  ON public.quote_acceptances 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q 
      WHERE q.id = quote_acceptances.quote_id 
      AND q.user_id = auth.uid()
    )
  );
