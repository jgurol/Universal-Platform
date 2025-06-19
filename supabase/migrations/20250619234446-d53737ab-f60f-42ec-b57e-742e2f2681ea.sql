
-- Enable Row Level Security on quote_templates table if not already enabled
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own templates" ON public.quote_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.quote_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.quote_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.quote_templates;
DROP POLICY IF EXISTS "Admins can view all templates" ON public.quote_templates;
DROP POLICY IF EXISTS "Admins can insert all templates" ON public.quote_templates;
DROP POLICY IF EXISTS "Admins can update all templates" ON public.quote_templates;
DROP POLICY IF EXISTS "Admins can delete all templates" ON public.quote_templates;

-- Create policy for users to view their own templates OR for admins to view all templates
CREATE POLICY "Users can view own templates, admins can view all" 
ON public.quote_templates 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR public.get_current_user_role() = 'admin'
);

-- Create policy for users to insert their own templates
CREATE POLICY "Users can insert their own templates" 
ON public.quote_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own templates OR for admins to update all templates
CREATE POLICY "Users can update own templates, admins can update all" 
ON public.quote_templates 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR public.get_current_user_role() = 'admin'
);

-- Create policy for users to delete their own templates OR for admins to delete all templates
CREATE POLICY "Users can delete own templates, admins can delete all" 
ON public.quote_templates 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR public.get_current_user_role() = 'admin'
);
