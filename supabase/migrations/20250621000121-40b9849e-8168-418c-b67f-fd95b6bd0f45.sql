
-- Update the RLS policy to allow agents to view templates created by admins
-- This replaces the existing restrictive policy with one that allows cross-user access for templates

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own templates, admins can view all" ON public.quote_templates;

-- Create new policy that allows:
-- 1. Users to view their own templates
-- 2. Admins to view all templates 
-- 3. All authenticated users to view templates created by admins
CREATE POLICY "Users can view own templates and admin templates" 
ON public.quote_templates 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.get_current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = quote_templates.user_id 
    AND role = 'admin'
  )
);
