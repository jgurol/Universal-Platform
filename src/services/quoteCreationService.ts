
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/pages/Index";

export const createQuoteInDatabase = async (
  quote: Omit<Quote, "id">,
  userId: string
): Promise<string> => {
  console.log('[createQuoteInDatabase] Creating quote with addresses:', {
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress,
    description: quote.description
  });

  const { data, error } = await supabase
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

  if (error) {
    console.error('Error creating quote:', error);
    throw error;
  }

  console.log('[createQuoteInDatabase] Quote created successfully with addresses:', {
    id: data.id,
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress
  });

  return data.id;
};
