
-- Create a function to update quote status that bypasses RLS
CREATE OR REPLACE FUNCTION public.update_quote_status(quote_id uuid, new_status text)
RETURNS void
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.quotes 
  SET 
    status = new_status,
    accepted_at = CASE 
      WHEN new_status = 'approved' THEN now() 
      ELSE accepted_at 
    END,
    updated_at = now()
  WHERE id = quote_id;
END;
$$;
