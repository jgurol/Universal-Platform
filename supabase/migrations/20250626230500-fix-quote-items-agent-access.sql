
-- Fix RLS policies for quote_items to allow agents to view quote items for their assigned clients

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update their own quote items" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete their own quote items" ON public.quote_items;

-- Create new comprehensive policies that allow:
-- 1. Users to see their own quote items
-- 2. Agents to see quote items for quotes associated with their assigned clients
-- 3. Admins to see all quote items

CREATE POLICY "Users and agents can view quote items" 
  ON public.quote_items 
  FOR SELECT 
  USING (
    -- User owns the quote
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
    OR
    -- User is associated with the agent assigned to the client for this quote
    EXISTS (
      SELECT 1 FROM public.quotes q
      JOIN public.client_info ci ON q.client_info_id = ci.id
      JOIN public.profiles p ON p.associated_agent_id = ci.agent_id
      WHERE q.id = quote_items.quote_id
      AND p.id = auth.uid()
    )
    OR
    -- User is an admin
    (public.get_current_user_role() = 'admin')
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
    OR
    -- Admins can insert any quote items
    (public.get_current_user_role() = 'admin')
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
    OR
    -- Admins can update any quote items
    (public.get_current_user_role() = 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes 
      WHERE quotes.id = quote_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
    OR
    -- Admins can update any quote items
    (public.get_current_user_role() = 'admin')
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
    OR
    -- Admins can delete any quote items
    (public.get_current_user_role() = 'admin')
  );
