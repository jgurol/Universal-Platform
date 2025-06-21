
import { supabase } from "@/integrations/supabase/client";

export const saveCircuitQuoteCategories = async (circuitQuoteId: string, categories: string[]) => {
  try {
    // First, delete existing categories for this quote
    await supabase
      .from('circuit_quote_categories')
      .delete()
      .eq('circuit_quote_id', circuitQuoteId);

    // Then insert the new categories
    if (categories.length > 0) {
      const categoriesToInsert = categories.map(category => ({
        circuit_quote_id: circuitQuoteId,
        category_name: category
      }));

      const { error } = await supabase
        .from('circuit_quote_categories')
        .insert(categoriesToInsert);

      if (error) {
        console.error('Error saving circuit quote categories:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in saveCircuitQuoteCategories:', error);
    return false;
  }
};
