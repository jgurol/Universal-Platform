
-- Update the RLS policies to hide deals from creators if they're associated with a different agent

-- Drop the current policy
DROP POLICY IF EXISTS "Users can view accessible deals" ON public.deal_registrations;

-- Create new policy with stricter filtering
CREATE POLICY "Users can view accessible deals" 
  ON public.deal_registrations 
  FOR SELECT 
  USING (
    -- Admins can see all deals
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ))
    OR
    -- If deal has an agent assigned, only users associated with that agent can see it
    (deal_registrations.agent_id IS NOT NULL 
     AND auth.uid() IN (
       SELECT p.id FROM public.profiles p 
       WHERE p.associated_agent_id = deal_registrations.agent_id
     ))
    OR
    -- If deal has no agent assigned, only the creator can see it
    (deal_registrations.agent_id IS NULL 
     AND auth.uid() = user_id)
  );
