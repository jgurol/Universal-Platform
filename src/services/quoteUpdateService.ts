
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/pages/Index";

export const updateQuoteInDatabase = async (quote: Quote): Promise<void> => {
  console.log('[updateQuoteInDatabase] Updating quote with addresses:', {
    id: quote.id,
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress,
    description: quote.description
  });

  const { error } = await supabase
    .from('quotes')
    .update({
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
      template_id: quote.templateId,
      updated_at: new Date().toISOString()
    })
    .eq('id', quote.id);

  if (error) {
    console.error('Error updating quote:', error);
    throw error;
  }
  
  console.log('[updateQuoteInDatabase] Quote updated successfully with addresses:', {
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress
  });
};
