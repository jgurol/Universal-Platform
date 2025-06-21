
-- Update the quotes table RLS policies to ensure proper visibility

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view quotes for their associated clients" ON public.quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON public.quotes;

-- Enable RLS on quotes table
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Allow users to view quotes they created
CREATE POLICY "Users can view their own quotes" 
  ON public.quotes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to view quotes for clients assigned to their associated agent
CREATE POLICY "Users can view quotes for their associated clients" 
  ON public.quotes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.client_info ci ON ci.agent_id = p.associated_agent_id
      WHERE p.id = auth.uid() 
      AND ci.id = quotes.client_info_id
      AND p.associated_agent_id IS NOT NULL
    )
  );

-- Allow admins to view all quotes
CREATE POLICY "Admins can view all quotes" 
  ON public.quotes 
  FOR SELECT 
  USING (public.get_current_user_role() = 'admin');

-- Allow users to insert their own quotes
CREATE POLICY "Users can insert their own quotes" 
  ON public.quotes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own quotes
CREATE POLICY "Users can update their own quotes" 
  ON public.quotes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own quotes
CREATE POLICY "Users can delete their own quotes" 
  ON public.quotes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow admins to insert, update, and delete any quotes
CREATE POLICY "Admins can insert any quotes" 
  ON public.quotes 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update any quotes" 
  ON public.quotes 
  FOR UPDATE 
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete any quotes" 
  ON public.quotes 
  FOR DELETE 
  USING (public.get_current_user_role() = 'admin');
