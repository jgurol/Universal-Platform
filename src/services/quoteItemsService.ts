
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

    return data.map(item => ({
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
      item: item.item,
      address: item.address // This should now properly include the address for carrier items
    }));
  } catch (error) {
    console.error('Error in fetchQuoteItems:', error);
    return [];
  }
};

export const updateQuoteItems = async (quoteId: string, items: QuoteItemData[]) => {
  try {
    console.log('[QuoteItemsService] Updating quote items with address assignments and descriptions:', 
      items.map(item => ({
        id: item.id,
        address_id: item.address_id,
        custom_name: item.name,
        custom_description: item.description
      }))
    );

    // First, delete existing quote items for this quote
    const { error: deleteError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId);

    if (deleteError) {
      console.error('Error deleting existing quote items:', deleteError);
      throw deleteError;
    }

    // Filter out items that don't have real item_ids (like carrier quotes)
    const validItems = items.filter(item => {
      const isCarrierItem = item.item_id.startsWith('carrier-');
      if (isCarrierItem) {
        console.log('[QuoteItemsService] Skipping carrier item (will be handled as temporary item):', item.name);
        return false;
      }
      return true;
    });

    // Insert valid items with real item_ids
    if (validItems.length > 0) {
      const itemsToInsert = validItems.map(item => {
        console.log('[QuoteItemsService] Inserting item', item.id, 'with address_id:', item.address_id);
        return {
          quote_id: quoteId,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          charge_type: item.charge_type,
          address_id: item.address_id
        };
      });

      const { error: insertError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (insertError) {
        console.error('Error inserting quote items:', insertError);
        throw insertError;
      }
    }

    // Handle carrier items separately - create them as temporary items (is_active = false)
    const carrierItems = items.filter(item => item.item_id.startsWith('carrier-'));
    
    if (carrierItems.length > 0) {
      // First, create temporary items in the items table for carrier quotes
      const temporaryItems = await Promise.all(
        carrierItems.map(async (carrierItem) => {
          // Build description without location or term - only include notes
          const descriptionParts = [];
          if (carrierItem.description) {
            // Clean description to remove location and term information
            const cleanDescription = carrierItem.description
              .replace(/Location: [^|]+\s*\|\s*?/g, '') // Remove "Location: xxx |"
              .replace(/\|\s*Location: [^|]+/g, '') // Remove "| Location: xxx"
              .replace(/^Location: [^|]+$/g, '') // Remove standalone "Location: xxx"
              .replace(/Term: [^|]+\s*\|\s*?/g, '') // Remove "Term: xxx |"
              .replace(/\|\s*Term: [^|]+/g, '') // Remove "| Term: xxx"
              .replace(/^Term: [^|]+$/g, '') // Remove standalone "Term: xxx"
              .trim();
            
            if (cleanDescription) {
              descriptionParts.push(cleanDescription);
            }
          }

          // Create a temporary item in the items table that won't appear in catalog
          const { data: newItem, error: itemError } = await supabase
            .from('items')
            .insert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              name: carrierItem.name,
              description: descriptionParts.join(' | '), // Clean description without location or term
              price: carrierItem.unit_price,
              cost: carrierItem.cost_override || 0,
              charge_type: carrierItem.charge_type,
              is_active: false // This ensures it won't appear in the catalog
            })
            .select()
            .single();

          if (itemError) {
            console.error('Error creating temporary item for carrier quote:', itemError);
            throw itemError;
          }

          return {
            ...carrierItem,
            item_id: newItem.id, // Use the new item's UUID
            temporaryItemId: newItem.id
          };
        })
      );

      // Now insert the quote items with valid UUIDs
      const carrierQuoteItems = temporaryItems.map(item => ({
        quote_id: quoteId,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        charge_type: item.charge_type,
        address_id: item.address_id
      }));

      const { error: carrierInsertError } = await supabase
        .from('quote_items')
        .insert(carrierQuoteItems);

      if (carrierInsertError) {
        console.error('Error inserting carrier quote items:', carrierInsertError);
        throw carrierInsertError;
      }

      console.log('[QuoteItemsService] Successfully created carrier items as temporary items (not in catalog)');
    }

    console.log('[QuoteItemsService] Quote items updated successfully');
  } catch (error) {
    console.error('Error updating quote items:', error);
    throw error;
  }
};

export const calculateTotalsByChargeType = (items: QuoteItemData[]) => {
  const mrcTotal = items
    .filter(item => item.charge_type === 'MRC')
    .reduce((sum, item) => sum + item.total_price, 0);
  
  const nrcTotal = items
    .filter(item => item.charge_type === 'NRC')
    .reduce((sum, item) => sum + item.total_price, 0);
  
  const totalAmount = mrcTotal + nrcTotal;
  
  return { mrcTotal, nrcTotal, totalAmount };
};
