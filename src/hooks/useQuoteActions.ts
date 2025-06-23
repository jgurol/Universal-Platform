import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Quote, Client } from "@/pages/Index";
import { addQuoteToDatabase, updateQuoteInDatabase, deleteQuoteFromDatabase, unarchiveQuoteFromDatabase, permanentlyDeleteQuoteFromDatabase } from "@/services/quoteService";

export const useQuoteActions = (
  clients: Client[],
  fetchQuotes: () => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const addQuote = async (newQuote: Omit<Quote, "id">) => {
    if (!user) {
      console.error('[addQuote] No user found, cannot create quote');
      toast({
        title: "Error",
        description: "You must be logged in to create a quote.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('[addQuote] Creating quote with user:', user.id);
      console.log('[addQuote] Creating quote with data:', {
        ...newQuote,
        quoteItemsCount: newQuote.quoteItems?.length || 0
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
      toast({
        title: "Error",
        description: "Failed to create quote. Please try again.",
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

  const permanentlyDeleteQuote = async (quoteId: string) => {
    if (!user) {
      console.error('[permanentlyDeleteQuote] No user found, cannot permanently delete quote');
      return;
    }
    
    try {
      console.log('[permanentlyDeleteQuote] Permanently deleting quote:', quoteId, 'by user:', user.id);
      await permanentlyDeleteQuoteFromDatabase(quoteId);
      
      fetchQuotes();
      toast({
        title: "Quote deleted permanently",
        description: "The quote has been permanently deleted and cannot be recovered.",
      });
    } catch (error) {
      console.error('[permanentlyDeleteQuote] Error permanently deleting quote:', error);
      toast({
        title: "Error",
        description: "Failed to permanently delete quote. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    addQuote,
    updateQuote,
    deleteQuote,
    unarchiveQuote,
    permanentlyDeleteQuote
  };
};
