
import { supabase } from "@/integrations/supabase/client";
import { QuoteItemData } from "@/types/quoteItems";

export const fetchQuoteItems = async (quoteId: string): Promise<QuoteItemData[]> => {
  try {
    const { data, error } = await supabase
      .from('quote_items')
      .select(`
        *,
        item:items(*),
        address:client_addresses(*)
      `)
      .eq('quote_id', quoteId);

    if (error) {
      console.error('Error fetching quote items:', error);
      return [];
    }

    console.log('[fetchQuoteItems] Raw data from database:', data);

    return data.map(item => {
      // Construct image URL if we have image_name but no image_url
      let imageUrl = item.image_url;
      if (!imageUrl && item.image_name) {
        imageUrl = supabase.storage.from('quote-item-images').getPublicUrl(item.image_name).data.publicUrl;
        console.log('[fetchQuoteItems] Constructed image URL:', imageUrl);
      }

      console.log('[fetchQuoteItems] Processing item:', {
        id: item.id,
        item_name: item.item?.name,
        address_id: item.address_id,
        address_data: item.address,
        image_url: imageUrl,
        image_name: item.image_name,
        original_image_url: item.image_url
      });

      return {
        id: item.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        cost_override: item.item?.cost || 0,
        total_price: item.total_price,
        charge_type: item.charge_type as 'NRC' | 'MRC',
        address_id: item.address_id,
        name: item.item?.name || 'Unknown Item',
        description: item.item?.description || '',
        image_url: imageUrl,
        image_name: item.image_name,
        item: item.item,
        address: item.address
      };
    });
  } catch (error) {
    console.error('Error in fetchQuoteItems:', error);
    return [];
  }
};
