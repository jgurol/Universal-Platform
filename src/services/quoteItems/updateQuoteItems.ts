
import { supabase } from "@/integrations/supabase/client";
import { QuoteItemData } from "@/types/quoteItems";

export const updateQuoteItems = async (quoteId: string, quoteItems: QuoteItemData[]) => {
  console.log('[updateQuoteItems] Starting update for quote:', quoteId, 'with items:', quoteItems.length);
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[updateQuoteItems] User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    console.log('[updateQuoteItems] Current user ID:', user.id);

    // Get user's profile to check if they're an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[updateQuoteItems] Error fetching user profile:', profileError);
      throw new Error('Error checking user permissions');
    }

    const isAdmin = profile?.role === 'admin';
    console.log('[updateQuoteItems] User is admin:', isAdmin);

    // Check if the quote exists and get ownership info
    const { data: quoteCheck, error: quoteCheckError } = await supabase
      .from('quotes')
      .select('id, user_id')
      .eq('id', quoteId);

    console.log('[updateQuoteItems] Quote check result:', { quoteCheck, quoteCheckError });

    if (quoteCheckError) {
      console.error('[updateQuoteItems] Error checking quote existence:', quoteCheckError);
      throw new Error('Error checking quote existence');
    }

    if (!quoteCheck || quoteCheck.length === 0) {
      console.error('[updateQuoteItems] Quote not found:', quoteId);
      throw new Error('Quote not found');
    }

    const quote = quoteCheck[0];
    console.log('[updateQuoteItems] Found quote:', { id: quote.id, user_id: quote.user_id, current_user: user.id });

    // Check if user owns the quote OR is an admin
    const hasAccess = quote.user_id === user.id || isAdmin;
    
    if (!hasAccess) {
      console.error('[updateQuoteItems] Access denied - user does not own quote and is not admin');
      throw new Error('Access denied - you do not own this quote');
    }

    console.log('[updateQuoteItems] Access granted for user:', user.id, 'Admin:', isAdmin);

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
        cost_override: quoteItem.cost_override,
        description: quoteItem.description?.substring(0, 50) + '...',
        image_url: quoteItem.image_url,
        image_name: quoteItem.image_name
      });

      let itemId = quoteItem.item?.id;

      // Check if this is a carrier item (item_id starts with "carrier-") 
      const isCarrierItem = quoteItem.item?.id?.startsWith('carrier-');
      const isValidUUID = itemId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);

      // For carrier items, DON'T create catalog items - just create a placeholder item temporarily
      if (isCarrierItem) {
        console.log('[updateQuoteItems] Handling carrier quote item - creating temporary placeholder:', quoteItem.name);
        
        // Create a temporary placeholder item that won't persist in the catalog
        const tempItemData = {
          user_id: user.id,
          name: quoteItem.name || 'Carrier Item',
          description: quoteItem.description || '',
          price: quoteItem.unit_price || 0,
          cost: quoteItem.cost_override || 0, // Use the total cost including add-ons from the quote item
          charge_type: quoteItem.charge_type || 'MRC',
          is_active: false // Mark as inactive so it doesn't show in catalog
        };

        const { data: tempItem, error: tempItemError } = await supabase
          .from('items')
          .insert(tempItemData)
          .select()
          .single();

        if (tempItemError) {
          console.error('[updateQuoteItems] Error creating temporary carrier item:', tempItemError);
          throw tempItemError;
        }

        itemId = tempItem.id;
        console.log('[updateQuoteItems] Created temporary placeholder item (inactive) for carrier with ID:', itemId);
      } else if (!isValidUUID) {
        // Only create catalog items for non-carrier items that don't have valid UUIDs
        console.log('[updateQuoteItems] Creating catalog item for regular quote item:', quoteItem.name);
        
        const tempItemData = {
          user_id: user.id,
          name: quoteItem.name,
          description: quoteItem.description || '',
          price: quoteItem.unit_price || 0,
          cost: quoteItem.cost_override || 0,
          charge_type: quoteItem.charge_type || 'MRC',
          is_active: true // Regular items should be active in catalog
        };

        const { data: tempItem, error: tempItemError } = await supabase
          .from('items')
          .insert(tempItemData)
          .select()
          .single();

        if (tempItemError) {
          console.error('[updateQuoteItems] Error creating catalog item:', tempItemError);
          throw tempItemError;
        }

        itemId = tempItem.id;
        console.log('[updateQuoteItems] Created catalog item with ID:', itemId);
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
