
import { supabase } from "@/integrations/supabase/client";
import { Quote, Client } from "@/pages/Index";
import { calculateCommission } from "@/services/commissionService";
import { useToast } from "@/hooks/use-toast";
import { DatabaseQuote } from "@/types/quote";

export const addQuoteToDatabase = async (
  newQuote: Omit<Quote, "id">,
  clients: Client[],
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
) => {
  try {
    console.log('[addQuote] Starting quote creation process');
    console.log('[addQuote] Template ID being saved:', newQuote.templateId);
    
    const commission = await calculateCommission(
      newQuote.amount,
      newQuote.clientId,
      clients,
      newQuote.clientInfoId,
      newQuote.commissionOverride
    );

    const cleanDescription = newQuote.description || "";

    const quoteDataToInsert = {
      client_id: newQuote.clientId || null,
      client_info_id: newQuote.clientInfoId === "none" ? null : newQuote.clientInfoId,
      amount: newQuote.amount,
      date: newQuote.date,
      description: cleanDescription,
      quote_number: newQuote.quoteNumber,
      quote_month: newQuote.quoteMonth,
      quote_year: newQuote.quoteYear,
      status: newQuote.status || 'pending',
      commission: commission,
      commission_override: newQuote.commissionOverride || null,
      expires_at: newQuote.expiresAt,
      notes: newQuote.notes,
      billing_address: newQuote.billingAddress,
      service_address: newQuote.serviceAddress,
      template_id: newQuote.templateId || null,
      user_id: userId
    };

    console.log('[addQuote] Data being inserted:', quoteDataToInsert);

    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .insert(quoteDataToInsert)
      .select('*')
      .single();

    if (quoteError) {
      console.error('[addQuote] Database error:', quoteError);
      toast({
        title: "Failed to add quote",
        description: quoteError.message,
        variant: "destructive"
      });
      return null;
    }

    const typedQuoteData = quoteData as DatabaseQuote;
    console.log('[addQuote] Quote created successfully with template_id:', typedQuoteData.template_id);

    // Add quote items if any exist
    if (quoteData && newQuote.quoteItems && newQuote.quoteItems.length > 0) {
      const quoteItemsToInsert = newQuote.quoteItems.map(item => ({
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
        .insert(quoteItemsToInsert);

      if (itemsError) {
        console.error('Error adding quote items:', itemsError);
        toast({
          title: "Quote added but items failed",
          description: "The quote was created but some items couldn't be added.",
          variant: "destructive"
        });
      }
    }

    return quoteData;
  } catch (err) {
    console.error('[addQuote] Unexpected error:', err);
    toast({
      title: "Error",
      description: "Failed to add quote",
      variant: "destructive"
    });
    return null;
  }
};
