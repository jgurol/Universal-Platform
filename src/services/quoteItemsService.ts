
import { supabase } from "@/integrations/supabase/client";
import { QuoteItemData } from "@/types/quoteItems";

export const fetchQuoteItems = async (quoteId: string): Promise<QuoteItemData[]> => {
  try {
    const { data: items, error } = await supabase
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

    if (items) {
      return items.map(item => ({
        id: item.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        charge_type: (item.charge_type as 'NRC' | 'MRC') || 'NRC',
        address_id: item.address_id,
        name: item.item?.name || '',
        description: item.item?.description || '',
        item: item.item,
        address: item.address
      }));
    }
    
    return [];
  } catch (err) {
    console.error('Exception fetching quote items:', err);
    return [];
  }
};

export const updateQuoteItems = async (quoteId: string, quoteItems: QuoteItemData[]): Promise<void> => {
  try {
    console.log('[QuoteItemsService] Updating quote items with address assignments:', quoteItems.map(item => ({ id: item.id, address_id: item.address_id })));
    
    // Delete existing quote items
    await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId);

    if (quoteItems.length > 0) {
      // First, update the items table with any custom names/descriptions
      for (const quoteItem of quoteItems) {
        if (quoteItem.name !== quoteItem.item?.name || quoteItem.description !== quoteItem.item?.description) {
          console.log(`[QuoteItemsService] Updating item ${quoteItem.item_id} with custom name/description:`, {
            originalName: quoteItem.item?.name,
            customName: quoteItem.name,
            originalDescription: quoteItem.item?.description,
            customDescription: quoteItem.description
          });
          
          const { error: itemUpdateError } = await supabase
            .from('items')
            .update({
              name: quoteItem.name,
              description: quoteItem.description
            })
            .eq('id', quoteItem.item_id);

          if (itemUpdateError) {
            console.error('Error updating item with custom description:', itemUpdateError);
          }
        }
      }

      // Then insert the quote items with proper address_id handling
      const itemsToInsert = quoteItems.map(item => {
        console.log(`[QuoteItemsService] Inserting item ${item.id} with address_id: ${item.address_id}`);
        return {
          quote_id: quoteId,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          charge_type: item.charge_type,
          address_id: item.address_id || null
        };
      });

      const { error: insertError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (insertError) {
        console.error('Error inserting quote items:', insertError);
      } else {
        console.log('[QuoteItemsService] Successfully saved quote items with address assignments');
      }
    }
  } catch (err) {
    console.error('Error updating quote items:', err);
  }
};

export const calculateTotalsByChargeType = (items: QuoteItemData[]) => {
  const nrcTotal = items
    .filter(item => item.charge_type === 'NRC')
    .reduce((total, item) => total + item.total_price, 0);
  
  const mrcTotal = items
    .filter(item => item.charge_type === 'MRC')
    .reduce((total, item) => total + item.total_price, 0);
  
  return { nrcTotal, mrcTotal, totalAmount: nrcTotal + mrcTotal };
};
