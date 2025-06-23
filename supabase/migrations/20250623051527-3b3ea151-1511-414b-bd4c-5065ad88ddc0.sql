
-- Create a function to permanently delete a quote and all related data
CREATE OR REPLACE FUNCTION public.permanently_delete_quote(quote_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete related quote items first (due to foreign key constraints)
  DELETE FROM public.quote_items WHERE quote_id = permanently_delete_quote.quote_id;
  
  -- Delete quote acceptances
  DELETE FROM public.quote_acceptances WHERE quote_id = permanently_delete_quote.quote_id;
  
  -- Delete the quote itself
  DELETE FROM public.quotes WHERE id = permanently_delete_quote.quote_id;
END;
$function$
