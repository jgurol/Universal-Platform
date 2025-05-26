
import { supabase } from "@/integrations/supabase/client";

export const deleteQuoteFromDatabase = async (quoteId: string): Promise<void> => {
  console.log('[deleteQuoteFromDatabase] Archiving quote:', quoteId);

  // Use the database function that properly handles archiving
  const { error } = await supabase.rpc('delete_quote', {
    quote_id: quoteId
  });

  if (error) {
    console.error('Error archiving quote:', error);
    throw error;
  }

  console.log('[deleteQuoteFromDatabase] Quote archived successfully');
};
