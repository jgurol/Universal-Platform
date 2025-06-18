
import { supabase } from "@/integrations/supabase/client";
import { QuoteItemData } from "@/types/quoteItems";
import { Item } from "@/types/items";
import { ClientAddress } from "@/types/clientAddress";

export const fetchQuoteItems = async (quoteId: string): Promise<QuoteItemData[]> => {
  console.log('[fetchQuoteItems] Fetching items for quote:', quoteId);
  
  try {
    const { data: quoteItemsData, error } = await supabase
      .from('quote_items')
      .select(`
        *,
        item:items(*),
        address:client_addresses(*)
      `)
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[fetchQuoteItems] Error fetching quote items:', error);
      throw error;
    }

    if (!quoteItemsData) {
      console.log('[fetchQuoteItems] No quote items found');
      return [];
    }

    console.log('[fetchQuoteItems] Raw quote items data:', quoteItemsData.length, 'items');

    const mappedItems: QuoteItemData[] = quoteItemsData.map((quoteItem: any) => {
      const item = quoteItem.item as Item;
      const address = quoteItem.address as ClientAddress;

      console.log('[fetchQuoteItems] Processing item:', {
        id: quoteItem.id,
        itemName: item?.name,
        itemDescription: item?.description?.substring(0, 100) + '...',
        addressId: quoteItem.address_id
      });

      const mappedItem: QuoteItemData = {
        id: quoteItem.id,
        item_id: quoteItem.item_id,
        quantity: quoteItem.quantity || 1,
        unit_price: parseFloat(quoteItem.unit_price) || 0,
        cost_override: item?.cost || 0,
        total_price: parseFloat(quoteItem.total_price) || 0,
        charge_type: (quoteItem.charge_type as 'NRC' | 'MRC') || 'NRC',
        address_id: quoteItem.address_id,
        name: item?.name || 'Unknown Item',
        description: item?.description || '', // This now contains the rich text content
        image_url: quoteItem.image_url,
        image_name: quoteItem.image_name,
        item: item,
        address: address
      };

      console.log('[fetchQuoteItems] Mapped item:', {
        id: mappedItem.id,
        name: mappedItem.name,
        descriptionLength: mappedItem.description?.length || 0,
        hasRichText: mappedItem.description?.includes('![') || mappedItem.description?.includes('**')
      });

      return mappedItem;
    });

    console.log('[fetchQuoteItems] Returning', mappedItems.length, 'mapped quote items');
    return mappedItems;
  } catch (error) {
    console.error('[fetchQuoteItems] Error in fetchQuoteItems:', error);
    throw error;
  }
};
