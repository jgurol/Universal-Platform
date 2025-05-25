
import { supabase } from "@/integrations/supabase/client";

export const deleteQuoteFromDatabase = async (quoteId: string): Promise<void> => {
  console.log('[deleteQuoteFromDatabase] Deleting quote:', quoteId);

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', quoteId);

  if (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }

  console.log('[deleteQuoteFromDatabase] Quote deleted successfully');
};
