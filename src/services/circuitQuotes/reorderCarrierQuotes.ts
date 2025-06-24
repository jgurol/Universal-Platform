
import { supabase } from "@/integrations/supabase/client";

export const reorderCarrierQuotes = async (carrierQuotes: Array<{ id: string; display_order: number }>) => {
  try {
    // Batch update all carrier quotes with their new display order
    const updates = carrierQuotes.map(({ id, display_order }) => 
      supabase
        .from('carrier_quotes')
        .update({ display_order })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    
    // Check if any updates failed
    const hasError = results.some(result => result.error);
    if (hasError) {
      console.error('Error updating carrier quote order:', results.find(r => r.error)?.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error reordering carrier quotes:', error);
    return false;
  }
};
