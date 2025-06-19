
-- Enable Row Level Security on quote_templates table
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own templates
CREATE POLICY "Users can view their own templates" 
ON public.quote_templates 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to insert their own templates
CREATE POLICY "Users can insert their own templates" 
ON public.quote_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own templates
CREATE POLICY "Users can update their own templates" 
ON public.quote_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for users to delete their own templates
CREATE POLICY "Users can delete their own templates" 
ON public.quote_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create admin policies to allow admins to view all templates
CREATE POLICY "Admins can view all templates" 
ON public.quote_templates 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Create admin policies to allow admins to manage all templates
CREATE POLICY "Admins can insert all templates" 
ON public.quote_templates 
FOR INSERT 
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all templates" 
ON public.quote_templates 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete all templates" 
ON public.quote_templates 
FOR DELETE 
USING (public.get_current_user_role() = 'admin');
