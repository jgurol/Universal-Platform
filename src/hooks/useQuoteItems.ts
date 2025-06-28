
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QuoteItemData } from "@/types/quoteItems";

export const useQuoteItems = (quote: any, open: boolean) => {
  const [quoteItems, setQuoteItems] = useState<QuoteItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuoteItems = async () => {
    if (!quote?.id) return;

    try {
      setIsLoading(true);
      
      const { data: quoteItemsData, error: quoteItemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          item:items(*),
          address:client_addresses(*)
        `)
        .eq('quote_id', quote.id)
        .order('created_at', { ascending: true });

      if (quoteItemsError) {
        console.error('Error fetching quote items:', quoteItemsError);
        return;
      }

      if (quoteItemsData) {
        const mappedItems: QuoteItemData[] = quoteItemsData.map((quoteItem: any) => ({
          id: quoteItem.id,
          item_id: quoteItem.item_id,
          quantity: quoteItem.quantity || 1,
          unit_price: parseFloat(quoteItem.unit_price) || 0,
          cost_override: quoteItem.item?.cost || 0,
          total_price: parseFloat(quoteItem.total_price) || 0,
          charge_type: (quoteItem.charge_type as 'NRC' | 'MRC') || 'NRC',
          address_id: quoteItem.address_id,
          name: quoteItem.item?.name || 'Unknown Item',
          description: quoteItem.item?.description || '',
          image_url: quoteItem.image_url,
          image_name: quoteItem.image_name,
          item: quoteItem.item,
          address: quoteItem.address
        }));
        
        setQuoteItems(mappedItems);
      }
    } catch (err) {
      console.error('Error fetching quote items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && quote?.id) {
      fetchQuoteItems();
    } else if (!open) {
      setQuoteItems([]);
    }
  }, [quote?.id, open]);

  return {
    quoteItems,
    setQuoteItems,
    isLoading
  };
};
