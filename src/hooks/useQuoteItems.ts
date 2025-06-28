
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QuoteItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  charge_type: 'MRC' | 'NRC';
  item?: {
    name: string;
    description?: string;
  };
}

export const useQuoteItems = (quoteId: string | undefined) => {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuoteItems = async () => {
    if (!quoteId) return;

    try {
      setIsLoading(true);
      
      const { data: quoteItemsData, error: quoteItemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          item:items(
            name,
            description
          )
        `)
        .eq('quote_id', quoteId);

      if (quoteItemsError) {
        console.error('Error fetching quote items:', quoteItemsError);
        return;
      }

      if (quoteItemsData) {
        setQuoteItems(quoteItemsData);
      }
    } catch (err) {
      console.error('Error fetching quote items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuoteItems();
  }, [quoteId]);

  return {
    quoteItems,
    isLoading
  };
};
