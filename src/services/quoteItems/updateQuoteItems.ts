
import { supabase } from "@/integrations/supabase/client";
import { QuoteItemData } from "@/types/quoteItems";

export const updateQuoteItems = async (quoteId: string, items: QuoteItemData[]): Promise<void> => {
  console.log('[updateQuoteItems] Starting update for quote:', quoteId, 'with items:', items.length);
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[updateQuoteItems] Error getting user:', userError);
      throw new Error('User not authenticated');
    }

    // First, delete all existing quote items for this quote
    const { error: deleteError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId);

    if (deleteError) {
      console.error('[updateQuoteItems] Error deleting existing items:', deleteError);
      throw deleteError;
    }

    console.log('[updateQuoteItems] Deleted existing items, now inserting new ones');

    // Insert all new quote items
    for (const item of items) {
      console.log('[updateQuoteItems] Processing item:', {
        name: item.name,
        item_id: item.item_id,
        address_id: item.address_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        description: item.description?.substring(0, 100) + '...', // Log first 100 chars
        image_url: item.image_url,
        image_name: item.image_name
      });

      let itemId = item.item_id;
      let itemName = item.name;
      let itemDescription = item.description;
      
      // Handle carrier quote items - create temporary items if needed
      if (item.item_id.startsWith('carrier-')) {
        console.log('[updateQuoteItems] Creating temporary item for carrier quote item:', item.name);
        
        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({
            user_id: user.id,
            name: item.name || 'Carrier Quote Item',
            description: item.description || '',
            price: item.unit_price,
            cost: item.cost_override || 0,
            charge_type: item.charge_type,
            is_active: false // Set to false so it doesn't appear in the catalog
          })
          .select()
          .single();

        if (itemError) {
          console.error('[updateQuoteItems] Error creating temporary item:', itemError);
          throw itemError;
        }
        
        itemId = newItem.id;
        console.log('[updateQuoteItems] Created temporary item with ID:', itemId);
      } else {
        // For regular items, we need to create a custom item record to store the custom name and description
        // This ensures the customizations are preserved
        const { data: customItem, error: customItemError } = await supabase
          .from('items')
          .insert({
            user_id: user.id,
            name: itemName || item.item?.name || 'Custom Item',
            description: itemDescription || '',
            price: item.unit_price,
            cost: item.cost_override || item.item?.cost || 0,
            charge_type: item.charge_type,
            is_active: false // Set to false so it doesn't appear in the catalog
          })
          .select()
          .single();

        if (customItemError) {
          console.error('[updateQuoteItems] Error creating custom item:', customItemError);
          throw customItemError;
        }
        
        itemId = customItem.id;
        console.log('[updateQuoteItems] Created custom item with ID:', itemId, 'for preserving customizations');
      }

      // Insert the quote item with image fields
      const insertData = {
        quote_id: quoteId,
        item_id: itemId,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        charge_type: item.charge_type,
        address_id: item.address_id || null,
        image_url: item.image_url || null,
        image_name: item.image_name || null
      };

      console.log('[updateQuoteItems] Inserting quote item with data:', insertData);

      const { error: insertError } = await supabase
        .from('quote_items')
        .insert(insertData);

      if (insertError) {
        console.error('[updateQuoteItems] Error inserting quote item:', insertError);
        throw insertError;
      }

      console.log('[updateQuoteItems] Successfully inserted quote item for:', item.name, 'with description length:', item.description?.length || 0);
    }

    console.log('[updateQuoteItems] Successfully updated all quote items');
  } catch (error) {
    console.error('[updateQuoteItems] Error updating quote items:', error);
    throw error;
  }
};
