
import { supabase } from "@/integrations/supabase/client";
import { QuoteItemData } from "@/types/quoteItems";

export const updateQuoteItems = async (quoteId: string, quoteItems: QuoteItemData[]) => {
  console.log('[updateQuoteItems] Starting update for quote:', quoteId, 'with items:', quoteItems.length);
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // First, delete existing quote items for this quote
    const { error: deleteError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId);

    if (deleteError) {
      console.error('[updateQuoteItems] Error deleting existing items:', deleteError);
      throw deleteError;
    }

    console.log('[updateQuoteItems] Deleted existing items, now inserting new ones');

    // Insert new quote items
    for (const quoteItem of quoteItems) {
      console.log('[updateQuoteItems] Processing item:', {
        name: quoteItem.name,
        item_id: quoteItem.item?.id,
        address_id: quoteItem.address_id,
        quantity: quoteItem.quantity,
        unit_price: quoteItem.unit_price,
        total_price: quoteItem.total_price,
        description: quoteItem.description?.substring(0, 50) + '...',
        image_url: quoteItem.image_url,
        image_name: quoteItem.image_name
      });

      // Use the item_id from the item object, not from a separate field
      let itemId = quoteItem.item?.id;

      // If we don't have an item ID, we need to create a temporary item
      if (!itemId && quoteItem.name) {
        console.log('[updateQuoteItems] Creating temporary item for quote item:', quoteItem.name);
        
        const tempItemData = {
          user_id: user.id,
          name: quoteItem.name,
          description: quoteItem.description || '',
          price: quoteItem.unit_price || 0,
          cost: 0,
          charge_type: quoteItem.charge_type || 'MRC',
          is_active: true
        };

        const { data: tempItem, error: tempItemError } = await supabase
          .from('items')
          .insert(tempItemData)
          .select()
          .single();

        if (tempItemError) {
          console.error('[updateQuoteItems] Error creating temporary item:', tempItemError);
          throw tempItemError;
        }

        itemId = tempItem.id;
        console.log('[updateQuoteItems] Created temporary item with ID:', itemId);
      }

      if (!itemId) {
        console.error('[updateQuoteItems] No item ID found for quote item:', quoteItem);
        continue;
      }

      const quoteItemData = {
        quote_id: quoteId,
        item_id: itemId,
        quantity: quoteItem.quantity || 1,
        unit_price: quoteItem.unit_price || 0,
        total_price: quoteItem.total_price || 0,
        charge_type: quoteItem.charge_type || 'MRC',
        address_id: quoteItem.address_id || null,
        image_url: quoteItem.image_url || null,
        image_name: quoteItem.image_name || null
      };

      console.log('[updateQuoteItems] Inserting quote item with data:', quoteItemData);

      const { error: insertError } = await supabase
        .from('quote_items')
        .insert(quoteItemData);

      if (insertError) {
        console.error('[updateQuoteItems] Error inserting quote item:', insertError);
        throw insertError;
      }
    }

    console.log('[updateQuoteItems] Successfully updated all quote items');
  } catch (error) {
    console.error('[updateQuoteItems] Error updating quote items:', error);
    throw error;
  }
};
