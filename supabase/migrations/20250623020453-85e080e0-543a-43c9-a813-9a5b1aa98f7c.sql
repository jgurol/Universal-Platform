
-- Check and fix RLS policies for quote_items to ensure proper data access
-- Drop existing policies to recreate them with better clarity
DROP POLICY IF EXISTS "Users can view quote items they own or admin access" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert quote items they own or admin access" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update quote items they own or admin access" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete quote items they own or admin access" ON public.quote_items;

-- Create new policies with explicit admin check and quote ownership
CREATE POLICY "Allow select quote_items for quote owners and admins" 
  ON public.quote_items 
  FOR SELECT 
  USING (
    -- Check if user is admin first (simpler check)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Or check if user owns the quote
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow insert quote_items for quote owners and admins" 
  ON public.quote_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow update quote_items for quote owners and admins" 
  ON public.quote_items 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow delete quote_items for quote owners and admins" 
  ON public.quote_items 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );
