
-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for email templates
CREATE POLICY "Users can view their own email templates" 
  ON public.email_templates 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email templates" 
  ON public.email_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email templates" 
  ON public.email_templates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email templates" 
  ON public.email_templates 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to ensure only one default template per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_email_template()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- If setting this template as default, unset all other default templates for this user
  IF NEW.is_default = true THEN
    UPDATE public.email_templates 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER ensure_single_default_email_template_trigger
  BEFORE INSERT OR UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_email_template();
