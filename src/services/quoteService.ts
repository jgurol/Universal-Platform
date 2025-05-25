
import { supabase } from "@/integrations/supabase/client";
import { Quote, Client } from "@/pages/Index";
import { calculateCommission } from "@/services/commissionService";
import { useToast } from "@/hooks/use-toast";

export const addQuoteToDatabase = async (
  newQuote: Omit<Quote, "id">,
  clients: Client[],
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
) => {
  try {
    console.log('[addQuote] Starting quote creation process');
    
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
      user_id: userId
    };

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

export const updateQuoteInDatabase = async (
  updatedQuote: Quote,
  clients: Client[],
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
) => {
  try {
    console.log('[updateQuote] Received quote data:', updatedQuote);
    
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
      billing_address: updatedQuote.billingAddress || null
    };

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

export const deleteQuoteFromDatabase = async (
  quoteId: string,
  userId: string,
  toast: ReturnType<typeof useToast>['toast']
) => {
  try {
    const { error } = await supabase.rpc('delete_quote', {
      quote_id: quoteId
    });

    if (error) {
      console.error('[deleteQuote] Error deleting quote:', error);
      toast({
        title: "Failed to delete quote",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }

    return true;
  } catch (err) {
    console.error('[deleteQuote] Error in delete quote operation:', err);
    toast({
      title: "Error",
      description: "Failed to delete quote",
      variant: "destructive"
    });
    return false;
  }
};
