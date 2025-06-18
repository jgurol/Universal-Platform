
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/pages/Index";

export const updateQuoteInDatabase = async (quote: Quote): Promise<void> => {
  console.log('[updateQuoteInDatabase] Updating quote with data:', {
    id: quote.id,
    description: quote.description,
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress,
    status: quote.status
  });

  // Helper function to convert empty strings to null for UUID fields
  const sanitizeUuid = (value: string | undefined | null): string | null => {
    if (!value || value.trim() === '') {
      return null;
    }
    return value;
  };

  const updateData = {
    client_id: sanitizeUuid(quote.clientId),
    client_info_id: sanitizeUuid(quote.clientInfoId),
    amount: quote.amount,
    date: quote.date,
    description: quote.description || null, // Explicitly handle description
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
    template_id: sanitizeUuid(quote.templateId),
    updated_at: new Date().toISOString()
  };

  console.log('[updateQuoteInDatabase] Update payload:', updateData);

  const { error } = await supabase
    .from('quotes')
    .update(updateData)
    .eq('id', quote.id);

  if (error) {
    console.error('Error updating quote:', error);
    throw error;
  }
  
  console.log('[updateQuoteInDatabase] Quote updated successfully with description:', quote.description);
};
