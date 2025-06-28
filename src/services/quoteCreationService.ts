
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/pages/Index";
import { QuoteItemData } from "@/types/quoteItems";
import { updateQuoteItems } from "./quoteItems/updateQuoteItems";

export const createQuoteInDatabase = async (
  quote: Omit<Quote, "id">,
  userId: string
): Promise<string> => {
  console.log('[createQuoteInDatabase] Creating quote with user_id:', userId);
  console.log('[createQuoteInDatabase] Creating quote with addresses and term:', {
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress,
    description: quote.description,
    term: quote.term, // Log the term value
    quoteItems: quote.quoteItems?.length || 0
  });

  // Ensure we have a valid userId
  if (!userId) {
    throw new Error('User ID is required to create a quote');
  }

  // Create the quote first
  const { data: quoteData, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      user_id: userId, // Make sure this is explicitly set
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
      term: quote.term, // Now this column exists in the database
      billing_address: quote.billingAddress,
      service_address: quote.serviceAddress,
      template_id: quote.templateId
    })
    .select()
    .single();

  if (quoteError) {
    console.error('[createQuoteInDatabase] Error creating quote:', quoteError);
    throw quoteError;
  }

  console.log('[createQuoteInDatabase] Quote created successfully with ID:', quoteData.id, 'user_id:', quoteData.user_id, 'term:', quoteData.term);

  // Save quote items if they exist using the updateQuoteItems function
  if (quote.quoteItems && quote.quoteItems.length > 0) {
    console.log('[createQuoteInDatabase] Saving quote items using updateQuoteItems:', quote.quoteItems.length);
    
    try {
      await updateQuoteItems(quoteData.id, quote.quoteItems);
      console.log('[createQuoteInDatabase] Quote items saved successfully using updateQuoteItems');
    } catch (error) {
      console.error('[createQuoteInDatabase] Error saving quote items:', error);
      throw error;
    }
  }

  console.log('[createQuoteInDatabase] Quote creation completed successfully with addresses and term:', {
    id: quoteData.id,
    user_id: quoteData.user_id,
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress,
    term: quoteData.term
  });

  return quoteData.id;
};
