
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
      // Calculate commission using override hierarchy
      const commission = await calculateCommission(
        newQuote.amount,
        newQuote.clientId,
        newQuote.clientInfoId,
        newQuote.commissionOverride
      );

      const { data, error } = await supabase
        .from('quotes')
        .insert({
          client_id: newQuote.clientId,
          client_info_id: newQuote.clientInfoId === "none" ? null : newQuote.clientInfoId,
          amount: newQuote.amount,
          date: newQuote.date,
          description: newQuote.description,
          quote_number: newQuote.quoteNumber,
          quote_month: newQuote.quoteMonth,
          quote_year: newQuote.quoteYear,
          status: newQuote.status || 'pending',
          commission: commission,
          commission_override: newQuote.commissionOverride || null,
          expires_at: newQuote.expiresAt,
          notes: newQuote.notes,
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding quote:', error);
        toast({
          title: "Failed to add quote",
          description: error.message,
          variant: "destructive"
        });
      } else if (data) {
        // Refresh quotes to get the new one
        fetchQuotes();
        
        const client = clients.find(c => c.id === newQuote.clientId);
        toast({
          title: "Quote added",
          description: `Quote for ${client?.name} has been added successfully.`,
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
      // Calculate commission using override hierarchy
      const commission = await calculateCommission(
        updatedQuote.amount,
        updatedQuote.clientId,
        updatedQuote.clientInfoId,
        updatedQuote.commissionOverride
      );

      const { data, error } = await supabase
        .from('quotes')
        .update({
          client_id: updatedQuote.clientId,
          client_info_id: updatedQuote.clientInfoId === "none" ? null : updatedQuote.clientInfoId,
          amount: updatedQuote.amount,
          date: updatedQuote.date,
          description: updatedQuote.description,
          quote_number: updatedQuote.quoteNumber,
          quote_month: updatedQuote.quoteMonth,
          quote_year: updatedQuote.quoteYear,
          status: updatedQuote.status,
          commission: commission,
          commission_override: updatedQuote.commissionOverride || null,
          expires_at: updatedQuote.expiresAt,
          notes: updatedQuote.notes
        })
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
        // Refresh quotes to get the updated one
        fetchQuotes();
        
        const client = clients.find(c => c.id === updatedQuote.clientId);
        toast({
          title: "Quote updated",
          description: `Quote for ${client?.name} has been updated successfully.`,
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
