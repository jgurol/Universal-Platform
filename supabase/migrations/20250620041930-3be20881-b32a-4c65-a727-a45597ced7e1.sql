
-- Add RLS policies for quote_items table to allow users to manage their own quote items
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

-- Also enable RLS on the quote_items table if it's not already enabled
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
