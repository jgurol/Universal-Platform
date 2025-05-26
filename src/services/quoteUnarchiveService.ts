
import { supabase } from "@/integrations/supabase/client";

export const unarchiveQuoteFromDatabase = async (quoteId: string): Promise<void> => {
  console.log('[unarchiveQuoteFromDatabase] Unarchiving quote:', quoteId);

  const { error } = await supabase
    .from('quotes')
    .update({ archived: false, updated_at: new Date().toISOString() })
    .eq('id', quoteId);

  if (error) {
    console.error('Error unarchiving quote:', error);
    throw error;
  }

  console.log('[unarchiveQuoteFromDatabase] Quote unarchived successfully');
};
