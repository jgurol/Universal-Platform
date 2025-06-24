
-- Create a table to track quote number sequences
CREATE TABLE public.quote_number_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  last_quote_number INTEGER NOT NULL DEFAULT 3499,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.quote_number_sequences ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own sequences
CREATE POLICY "Users can view their own quote sequences" 
  ON public.quote_number_sequences 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own sequences
CREATE POLICY "Users can create their own quote sequences" 
  ON public.quote_number_sequences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own sequences
CREATE POLICY "Users can update their own quote sequences" 
  ON public.quote_number_sequences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create a function to get and increment the next quote number
CREATE OR REPLACE FUNCTION public.get_next_quote_number(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Try to update existing sequence, if it exists
  UPDATE public.quote_number_sequences 
  SET 
    last_quote_number = last_quote_number + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING last_quote_number INTO next_number;
  
  -- If no sequence exists for this user, create one
  IF next_number IS NULL THEN
    INSERT INTO public.quote_number_sequences (user_id, last_quote_number)
    VALUES (p_user_id, 3500)
    RETURNING last_quote_number INTO next_number;
  END IF;
  
  RETURN next_number;
END;
$$;
