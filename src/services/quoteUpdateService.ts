
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/pages/Index";

export const updateQuoteInDatabase = async (quote: Quote): Promise<void> => {
  console.log('[updateQuoteInDatabase] Starting update with quote object:', {
    id: quote.id,
    description: quote.description,
    descriptionType: typeof quote.description,
    descriptionLength: quote.description?.length,
    fullQuote: quote
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
    description: quote.description, // Ensure description is included
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

  console.log('[updateQuoteInDatabase] Final update payload being sent to database:', updateData);
  console.log('[updateQuoteInDatabase] Description in payload:', {
    description: updateData.description,
    type: typeof updateData.description,
    length: updateData.description?.length
  });

  const { data, error } = await supabase
    .from('quotes')
    .update(updateData)
    .eq('id', quote.id)
    .select('*'); // Add select to see what was actually updated

  if (error) {
    console.error('[updateQuoteInDatabase] Database error:', error);
    throw error;
  }
  
  console.log('[updateQuoteInDatabase] Database response after update:', data);
  console.log('[updateQuoteInDatabase] Updated quote description from DB:', data?.[0]?.description);
  console.log('[updateQuoteInDatabase] Quote updated successfully');
};
