
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/pages/Index";
import { QuoteItemData } from "@/types/quoteItems";

export const createQuoteInDatabase = async (
  quote: Omit<Quote, "id">,
  userId: string
): Promise<string> => {
  console.log('[createQuoteInDatabase] Creating quote with addresses:', {
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress,
    description: quote.description,
    quoteItems: quote.quoteItems?.length || 0
  });

  // Create the quote first
  const { data: quoteData, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      user_id: userId,
      client_id: quote.clientId || null,
      client_info_id: quote.clientInfoId || null,
      amount: quote.amount,
      date: quote.date,
      description: quote.description,
      quote_number: quote.quoteNumber,
      quote_month: quote.quoteMonth,
      quote_year: quote.quoteYear,
      status: quote.status,
      commission: quote.commission,
      commission_override: quote.commissionOverride,
      expires_at: quote.expiresAt,
      notes: quote.notes,
      billing_address: quote.billingAddress,
      service_address: quote.serviceAddress,
      template_id: quote.templateId
    })
    .select()
    .single();

  if (quoteError) {
    console.error('Error creating quote:', quoteError);
    throw quoteError;
  }

  console.log('[createQuoteInDatabase] Quote created successfully with ID:', quoteData.id);

  // Save quote items if they exist
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    console.log('[createQuoteInDatabase] Saving quote items:', quote.quoteItems.length);
    
    for (const item of quote.quoteItems) {
      let itemId = item.item_id;
      
      // Handle carrier quote items - create temporary items for them that won't appear in catalog
      if (item.item_id.startsWith('carrier-')) {
        console.log('[createQuoteInDatabase] Creating temporary item for carrier quote item:', item.name);
        
        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({
            user_id: userId,
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
          console.error('Error creating temporary item for carrier quote:', itemError);
          throw itemError;
        }
        
        itemId = newItem.id;
        console.log('[createQuoteInDatabase] Created temporary item with ID:', itemId);
      }
      
      // Insert quote item with the correct item_id
      const { error: quoteItemError } = await supabase
        .from('quote_items')
        .insert({
          quote_id: quoteData.id,
          item_id: itemId,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          charge_type: item.charge_type,
          address_id: item.address_id || null
        });

      if (quoteItemError) {
        console.error('Error creating quote item:', quoteItemError);
        throw quoteItemError;
      }
    }

    console.log('[createQuoteInDatabase] Quote items saved successfully');
  }

  console.log('[createQuoteInDatabase] Quote creation completed successfully with addresses:', {
    id: quoteData.id,
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress
  });

  return quoteData.id;
};
