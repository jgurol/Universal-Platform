
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
    
    // Insert quote items - no need to update items table since we already created them
    const itemsToInsert = quote.quoteItems.map(item => ({
      quote_id: quoteData.id,
      item_id: item.item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      charge_type: item.charge_type,
      address_id: item.address_id || null
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating quote items:', itemsError);
      throw itemsError;
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
