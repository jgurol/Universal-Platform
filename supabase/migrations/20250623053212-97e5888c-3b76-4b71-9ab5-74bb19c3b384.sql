
-- First drop the existing function
DROP FUNCTION IF EXISTS public.permanently_delete_quote(uuid);

-- Then recreate it with the corrected parameter name
CREATE OR REPLACE FUNCTION public.permanently_delete_quote(p_quote_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete related quote items first (due to foreign key constraints)
  DELETE FROM public.quote_items WHERE quote_id = p_quote_id;
  
  -- Delete quote acceptances
  DELETE FROM public.quote_acceptances WHERE quote_id = p_quote_id;
  
  -- Delete the quote itself
  DELETE FROM public.quotes WHERE id = p_quote_id;
END;
$function$
