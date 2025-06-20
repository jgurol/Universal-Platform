
-- Fix RLS policies for quote_items table to properly allow users to manage their own quote items

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete their own quote items" ON public.quote_items;

-- Create new policies with proper checking
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

-- Ensure RLS is enabled
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
