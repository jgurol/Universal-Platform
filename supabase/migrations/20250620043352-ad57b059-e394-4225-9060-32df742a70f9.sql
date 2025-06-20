
-- First, let's check the current RLS policies and fix them
-- The issue might be that the policies are not properly checking the relationship

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete their own quote items" ON public.quote_items;

-- Recreate policies with more explicit checking
CREATE POLICY "Users can view their own quote items" 
  ON public.quote_items 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own quote items" 
  ON public.quote_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own quote items" 
  ON public.quote_items 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own quote items" 
  ON public.quote_items 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

-- Make sure RLS is enabled
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
