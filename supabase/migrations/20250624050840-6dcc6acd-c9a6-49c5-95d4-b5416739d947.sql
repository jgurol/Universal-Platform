
-- Update the global quote number sequence to start at 4500
UPDATE public.quote_number_sequences 
SET last_quote_number = 4499
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- If no record was updated (meaning it doesn't exist), insert one
INSERT INTO public.quote_number_sequences (user_id, last_quote_number)
SELECT '00000000-0000-0000-0000-000000000000', 4499
WHERE NOT EXISTS (
  SELECT 1 FROM public.quote_number_sequences 
  WHERE user_id = '00000000-0000-0000-0000-000000000000'
);
