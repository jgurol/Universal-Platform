
-- Update the RLS policies for deal_registrations to properly filter based on agent associations

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own deal registrations" ON public.deal_registrations;
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deal_registrations;
DROP POLICY IF EXISTS "Users can view deals for their associated clients" ON public.deal_registrations;
DROP POLICY IF EXISTS "Admins can view all deals" ON public.deal_registrations;
DROP POLICY IF EXISTS "Users can create their own deal registrations" ON public.deal_registrations;
DROP POLICY IF EXISTS "Users can create their own deals" ON public.deal_registrations;
DROP POLICY IF EXISTS "Users can update their own deal registrations" ON public.deal_registrations;
DROP POLICY IF EXISTS "Users can update their own deals" ON public.deal_registrations;
DROP POLICY IF EXISTS "Users can delete their own deal registrations" ON public.deal_registrations;
DROP POLICY IF EXISTS "Users can delete their own deals" ON public.deal_registrations;

-- Create new comprehensive policies

-- Allow users to view deals they created OR deals assigned to their associated agent
CREATE POLICY "Users can view accessible deals" 
  ON public.deal_registrations 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = deal_registrations.agent_id
      AND p.associated_agent_id IS NOT NULL
    ))
    OR
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ))
  );

-- Allow users to create deals
CREATE POLICY "Users can create deals" 
  ON public.deal_registrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update deals they have access to
CREATE POLICY "Users can update accessible deals" 
  ON public.deal_registrations 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = deal_registrations.agent_id
      AND p.associated_agent_id IS NOT NULL
    ))
    OR
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ))
  );

-- Allow users to delete deals they have access to
CREATE POLICY "Users can delete accessible deals" 
  ON public.deal_registrations 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR 
    (auth.uid() IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.associated_agent_id = deal_registrations.agent_id
      AND p.associated_agent_id IS NOT NULL
    ))
    OR
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ))
  );
