
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Quote, Client } from "@/pages/Index";

export const useQuoteActions = (
  clients: Client[],
  fetchQuotes: () => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper function to calculate commission using override hierarchy
  const calculateCommission = async (
    amount: number,
    clientId: string,
    clientInfoId?: string,
    quoteOverride?: number
  ): Promise<number> => {
    // 1. Quote override takes highest precedence
    if (quoteOverride !== undefined && quoteOverride !== null) {
      return (quoteOverride / 100) * amount;
    }

    // 2. Client override takes second precedence
    if (clientInfoId) {
      const { data: clientInfo } = await supabase
        .from('client_info')
        .select('commission_override')
        .eq('id', clientInfoId)
        .single();

      if (clientInfo?.commission_override !== null && clientInfo?.commission_override !== undefined) {
        return (clientInfo.commission_override / 100) * amount;
      }
    }

    // 3. Agent commission rate is the default
    const client = clients.find(c => c.id === clientId);
    if (client) {
      return (client.commissionRate / 100) * amount;
    }

    return 0;
  };

  // Function to add a new quote to Supabase
  const addQuote = async (newQuote: Omit<Quote, "id">) => {
    if (!user) return;
    
    try {
      console.log('[addQuote] Received quote data:', newQuote);
      console.log('[addQuote] Description value:', newQuote.description);
      
      // Calculate commission using override hierarchy
      const commission = await calculateCommission(
        newQuote.amount,
        newQuote.clientId,
        newQuote.clientInfoId,
        newQuote.commissionOverride
      );

      const quoteDataToInsert = {
        client_id: newQuote.clientId || null,
        client_info_id: newQuote.clientInfoId === "none" ? null : newQuote.clientInfoId,
        amount: newQuote.amount,
        date: newQuote.date,
        description: newQuote.description || "", // Fix: Ensure description is always a string, not null
        quote_number: newQuote.quoteNumber,
        quote_month: newQuote.quoteMonth,
        quote_year: newQuote.quoteYear,
        status: newQuote.status || 'pending',
        commission: commission,
        commission_override: newQuote.commissionOverride || null,
        expires_at: newQuote.expiresAt,
        notes: newQuote.notes,
        user_id: user.id
      };

      console.log('[addQuote] Data being inserted:', quoteDataToInsert);

      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert(quoteDataToInsert)
        .select('*')
        .single();

      if (quoteError) {
        console.error('Error adding quote:', quoteError);
        toast({
          title: "Failed to add quote",
          description: quoteError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('[addQuote] Quote successfully inserted:', quoteData);

      // Add quote items if any exist - now including charge_type and address_id
      if (newQuote.quoteItems && newQuote.quoteItems.length > 0 && quoteData) {
        const quoteItemsToInsert = newQuote.quoteItems.map(item => ({
          quote_id: quoteData.id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          charge_type: item.charge_type, // Fix: Include charge_type in database insert
          address_id: item.address_id || null // Fix: Include address_id in database insert
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

      if (quoteData) {
        // Refresh quotes to get the new one
        fetchQuotes();
        
        const client = clients.find(c => c.id === newQuote.clientId);
        toast({
          title: "Quote added",
          description: `Quote for ${client?.name || "client"} has been added successfully.`,
        });
      }
    } catch (err) {
      console.error('Error in add quote operation:', err);
      toast({
        title: "Error",
        description: "Failed to add quote",
        variant: "destructive"
      });
    }
  };

  // Function to update a quote in Supabase
  const updateQuote = async (updatedQuote: Quote) => {
    if (!user) return;
    
    try {
      console.log('[updateQuote] Received quote data:', updatedQuote);
      console.log('[updateQuote] Description value:', updatedQuote.description);
      
      // Calculate commission using override hierarchy
      const commission = await calculateCommission(
        updatedQuote.amount,
        updatedQuote.clientId,
        updatedQuote.clientInfoId,
        updatedQuote.commissionOverride
      );

      const quoteUpdateData = {
        client_id: updatedQuote.clientId || null,
        client_info_id: updatedQuote.clientInfoId === "none" ? null : updatedQuote.clientInfoId,
        amount: updatedQuote.amount,
        date: updatedQuote.date,
        description: updatedQuote.description || "", // Fix: Ensure description is always a string, not null
        quote_number: updatedQuote.quoteNumber,
        quote_month: updatedQuote.quoteMonth,
        quote_year: updatedQuote.quoteYear,
        status: updatedQuote.status,
        commission: commission,
        commission_override: updatedQuote.commissionOverride || null,
        expires_at: updatedQuote.expiresAt,
        notes: updatedQuote.notes
      };

      console.log('[updateQuote] Data being updated:', quoteUpdateData);

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
      } else {
        console.log('[updateQuote] Quote successfully updated:', data);
        // Refresh quotes to get the updated one
        fetchQuotes();
        
        const client = clients.find(c => c.id === updatedQuote.clientId);
        toast({
          title: "Quote updated",
          description: `Quote for ${client?.name || "client"} has been updated successfully.`,
        });
      }
    } catch (err) {
      console.error('Error in update quote operation:', err);
      toast({
        title: "Error",
        description: "Failed to update quote",
        variant: "destructive"
      });
    }
  };

  // Function to delete a quote
  const deleteQuote = async (quoteId: string) => {
    if (!user) return;
    
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
      } else {
        // Refresh quotes to reflect the deletion
        fetchQuotes();
        toast({
          title: "Quote deleted",
          description: "The quote has been deleted successfully.",
        });
      }
    } catch (err) {
      console.error('[deleteQuote] Error in delete quote operation:', err);
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive"
      });
    }
  };

  return {
    addQuote,
    updateQuote,
    deleteQuote
  };
};
