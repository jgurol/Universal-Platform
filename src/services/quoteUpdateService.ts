
import { supabase } from "@/integrations/supabase/client";
import { Quote, Client } from "@/pages/Index";
import { calculateCommission } from "@/services/commissionService";
import { useToast } from "@/hooks/use-toast";
import { DatabaseQuote } from "@/types/quote";

export const updateQuoteInDatabase = async (
  updatedQuote: Quote,
  clients: Client[],
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
) => {
  try {
    console.log('[updateQuote] Received quote data:', updatedQuote);
    console.log('[updateQuote] Template ID being saved:', updatedQuote.templateId);
    
    const commission = await calculateCommission(
      updatedQuote.amount,
      updatedQuote.clientId,
      clients,
      updatedQuote.clientInfoId,
      updatedQuote.commissionOverride
    );

    const quoteUpdateData = {
      client_id: updatedQuote.clientId || null,
      client_info_id: updatedQuote.clientInfoId === "none" ? null : updatedQuote.clientInfoId,
      amount: updatedQuote.amount,
      date: updatedQuote.date,
      description: updatedQuote.description || "",
      quote_number: updatedQuote.quoteNumber,
      quote_month: updatedQuote.quoteMonth || null,
      quote_year: updatedQuote.quoteYear || null,
      status: updatedQuote.status,
      commission: commission,
      commission_override: updatedQuote.commissionOverride || null,
      expires_at: updatedQuote.expiresAt || null,
      notes: updatedQuote.notes || null,
      billing_address: updatedQuote.billingAddress || null,
      service_address: updatedQuote.serviceAddress || null,
      template_id: updatedQuote.templateId || null
    };

    console.log('[updateQuote] Data being sent to database:', quoteUpdateData);

    const { data, error } = await supabase
      .from('quotes')
      .update(quoteUpdateData)
      .eq('id', updatedQuote.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating quote:', error);
      toast({
        title: "Failed to update quote",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }

    const typedData = data as DatabaseQuote;
    console.log('[updateQuote] Successfully updated quote with template_id:', typedData.template_id);
    return data;
  } catch (err) {
    console.error('Error in update quote operation:', err);
    toast({
      title: "Error",
      description: "Failed to update quote",
      variant: "destructive"
    });
    return null;
  }
};
