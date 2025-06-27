
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/pages/Index";
import { QuoteItemData } from "@/types/quoteItems";

export const updateQuoteInDatabase = async (
  quoteId: string,
  updatedQuote: Partial<Quote>,
  items: QuoteItemData[]
): Promise<void> => {
  console.log('Updating quote in database:', { quoteId, updatedQuote, items });

  // Prepare the quote data for database update
  const quoteUpdateData = {
    client_id: updatedQuote.clientId,
    client_info_id: updatedQuote.clientInfoId,
    date: updatedQuote.date,
    description: updatedQuote.description,
    quote_number: updatedQuote.quoteNumber,
    quote_month: updatedQuote.quoteMonth,
    quote_year: updatedQuote.quoteYear,
    status: updatedQuote.status,
    expires_at: updatedQuote.expiresAt,
    notes: updatedQuote.notes,
    term: updatedQuote.term, // Include term field
    commission_override: updatedQuote.commissionOverride,
    template_id: updatedQuote.templateId,
    billing_address: updatedQuote.billingAddress,
    service_address: updatedQuote.serviceAddress,
    updated_at: new Date().toISOString()
  };

  console.log('Quote update data prepared:', quoteUpdateData);

  // Update the quote
  const { error: quoteError } = await supabase
    .from('quotes')
    .update(quoteUpdateData)
    .eq('id', quoteId);

  if (quoteError) {
    console.error('Error updating quote:', quoteError);
    throw new Error(`Failed to update quote: ${quoteError.message}`);
  }

  // Delete existing quote items
  const { error: deleteItemsError } = await supabase
    .from('quote_items')
    .delete()
    .eq('quote_id', quoteId);

  if (deleteItemsError) {
    console.error('Error deleting existing quote items:', deleteItemsError);
    throw new Error(`Failed to delete existing quote items: ${deleteItemsError.message}`);
  }

  // Insert new quote items if any exist
  if (items && items.length > 0) {
    const quoteItemsData = items.map(item => ({
      quote_id: quoteId,
      item_id: item.item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      charge_type: item.charge_type,
      address_id: item.address_id
    }));

    console.log('Inserting new quote items:', quoteItemsData);

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(quoteItemsData);

    if (itemsError) {
      console.error('Error inserting quote items:', itemsError);
      throw new Error(`Failed to insert quote items: ${itemsError.message}`);
    }
  }

  console.log('Quote updated successfully');
};
