
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Quote, Client } from "@/pages/Index";
import { addQuoteToDatabase, updateQuoteInDatabase, deleteQuoteFromDatabase, unarchiveQuoteFromDatabase } from "@/services/quoteService";

export const useQuoteActions = (
  clients: Client[],
  fetchQuotes: () => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const addQuote = async (newQuote: Omit<Quote, "id">) => {
    // Enhanced authentication check for agents
    if (!user?.id) {
      console.error('[addQuote] No authenticated user found - user object:', user);
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a quote. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('[addQuote] Creating quote with authenticated user:', user.id);
      console.log('[addQuote] Quote data being sent:', {
        ...newQuote,
        quoteItemsCount: newQuote.quoteItems?.length || 0,
        hasAddresses: {
          billing: !!newQuote.billingAddress,
          service: !!newQuote.serviceAddress
        }
      });
      
      await addQuoteToDatabase(newQuote, user.id);
      
      fetchQuotes();
      const client = clients.find(c => c.id === newQuote.clientId);
      toast({
        title: "Quote added",
        description: `Quote for ${client?.name || "client"} has been added successfully.`,
      });
    } catch (error) {
      console.error('[addQuote] Error creating quote:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = "Failed to create quote. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('authentication') || error.message.includes('User ID')) {
          errorMessage = "Authentication error. Please refresh the page and try again.";
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          errorMessage = "Access denied. Please check your permissions or contact support.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateQuote = async (updatedQuote: Quote) => {
    if (!user) {
      console.error('[updateQuote] No user found, cannot update quote');
      toast({
        title: "Error",
        description: "You must be logged in to update a quote.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('[updateQuote] Updating quote with user:', user.id);
      console.log('[updateQuote] Updating quote with data:', updatedQuote);
      await updateQuoteInDatabase(updatedQuote);
      
      fetchQuotes();
      const client = clients.find(c => c.id === updatedQuote.clientId);
      toast({
        title: "Quote updated",
        description: `Quote for ${client?.name || "client"} has been updated successfully.`,
      });
    } catch (error) {
      console.error('[updateQuote] Error updating quote:', error);
      toast({
        title: "Error",
        description: "Failed to update quote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteQuote = async (quoteId: string) => {
    if (!user) {
      console.error('[deleteQuote] No user found, cannot delete quote');
      return;
    }
    
    try {
      console.log('[deleteQuote] Deleting quote:', quoteId, 'by user:', user.id);
      await deleteQuoteFromDatabase(quoteId);
      
      fetchQuotes();
      toast({
        title: "Quote archived",
        description: "The quote has been archived successfully.",
      });
    } catch (error) {
      console.error('[deleteQuote] Error deleting quote:', error);
      toast({
        title: "Error",
        description: "Failed to archive quote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const unarchiveQuote = async (quoteId: string) => {
    if (!user) {
      console.error('[unarchiveQuote] No user found, cannot unarchive quote');
      return;
    }
    
    try {
      console.log('[unarchiveQuote] Unarchiving quote:', quoteId, 'by user:', user.id);
      await unarchiveQuoteFromDatabase(quoteId);
      
      fetchQuotes();
      toast({
        title: "Quote restored",
        description: "The quote has been restored successfully.",
      });
    } catch (error) {
      console.error('[unarchiveQuote] Error unarchiving quote:', error);
      toast({
        title: "Error",
        description: "Failed to restore quote. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    addQuote,
    updateQuote,
    deleteQuote,
    unarchiveQuote
  };
};
