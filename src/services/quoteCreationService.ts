
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/pages/Index";
import { QuoteItemData } from "@/types/quoteItems";
import { updateQuoteItems } from "./quoteItems/updateQuoteItems";

export const createQuoteInDatabase = async (
  quote: Omit<Quote, "id">,
  userId: string
): Promise<string> => {
  console.log('[createQuoteInDatabase] Creating quote with user_id:', userId);
  console.log('[createQuoteInDatabase] Creating quote with addresses:', {
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress,
    description: quote.description,
    quoteItems: quote.quoteItems?.length || 0
  });

  // Ensure we have a valid userId
  if (!userId) {
    throw new Error('User ID is required to create a quote');
  }

  // Create the quote first - ensure user_id is explicitly passed and not null
  const quoteData = {
    user_id: userId, // Explicitly set user_id
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
  };

  console.log('[createQuoteInDatabase] Inserting quote data:', quoteData);

  const { data: createdQuote, error: quoteError } = await supabase
    .from('quotes')
    .insert(quoteData)
    .select()
    .single();

  if (quoteError) {
    console.error('[createQuoteInDatabase] Error creating quote:', quoteError);
    throw quoteError;
  }

  console.log('[createQuoteInDatabase] Quote created successfully:', {
    id: createdQuote.id,
    user_id: createdQuote.user_id
  });

  // Save quote items if they exist using the updateQuoteItems function
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    console.log('[createQuoteInDatabase] Saving quote items using updateQuoteItems:', quote.quoteItems.length);
    
    try {
      await updateQuoteItems(createdQuote.id, quote.quoteItems);
      console.log('[createQuoteInDatabase] Quote items saved successfully using updateQuoteItems');
    } catch (error) {
      console.error('[createQuoteInDatabase] Error saving quote items:', error);
      throw error;
    }
  }

  console.log('[createQuoteInDatabase] Quote creation completed successfully');

  return createdQuote.id;
};
