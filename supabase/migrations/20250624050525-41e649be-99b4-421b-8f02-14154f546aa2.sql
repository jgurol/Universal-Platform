
-- Drop the existing user-specific function
DROP FUNCTION IF EXISTS public.get_next_quote_number(UUID);

-- Update the quote_number_sequences table to use a single global sequence
-- First, delete any existing user-specific sequences
DELETE FROM public.quote_number_sequences;

-- Insert a single global sequence record (using a system UUID)
INSERT INTO public.quote_number_sequences (user_id, last_quote_number)
VALUES ('00000000-0000-0000-0000-000000000000', 3499)
ON CONFLICT DO NOTHING;

-- Create new function that doesn't require user_id parameter
CREATE OR REPLACE FUNCTION public.get_next_quote_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Update the global sequence
  UPDATE public.quote_number_sequences 
  SET 
    last_quote_number = last_quote_number + 1,
    updated_at = now()
  WHERE user_id = '00000000-0000-0000-0000-000000000000'
  RETURNING last_quote_number INTO next_number;
  
  -- If no global sequence exists, create one
  IF next_number IS NULL THEN
    INSERT INTO public.quote_number_sequences (user_id, last_quote_number)
    VALUES ('00000000-0000-0000-0000-000000000000', 3500)
    RETURNING last_quote_number INTO next_number;
  END IF;
  
  RETURN next_number;
END;
$$;
