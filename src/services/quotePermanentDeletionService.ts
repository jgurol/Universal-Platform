
import { supabase } from "@/integrations/supabase/client";

export const permanentlyDeleteQuoteFromDatabase = async (quoteId: string): Promise<void> => {
  console.log('[permanentlyDeleteQuoteFromDatabase] Permanently deleting quote:', quoteId);

  // Use the database function that handles permanent deletion
  const { error } = await supabase.rpc('permanently_delete_quote', {
    p_quote_id: quoteId
  });

  if (error) {
    console.error('Error permanently deleting quote:', error);
    throw error;
  }

  console.log('[permanentlyDeleteQuoteFromDatabase] Quote permanently deleted successfully');
};
