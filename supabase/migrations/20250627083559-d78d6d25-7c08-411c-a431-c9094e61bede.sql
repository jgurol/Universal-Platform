
-- Create table for agent agreement templates
CREATE TABLE public.agent_agreement_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.agent_agreement_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for agent agreement templates
CREATE POLICY "Users can view their own templates" 
  ON public.agent_agreement_templates 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
  ON public.agent_agreement_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
  ON public.agent_agreement_templates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
  ON public.agent_agreement_templates 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to ensure only one default template per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_agreement_template()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this template as default, unset all other default templates for this user
  IF NEW.is_default = true THEN
    UPDATE public.agent_agreement_templates 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the function
CREATE TRIGGER ensure_single_default_agreement_template_trigger
  BEFORE INSERT OR UPDATE ON public.agent_agreement_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_agreement_template();
