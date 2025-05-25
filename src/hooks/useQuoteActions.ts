
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Quote, Client } from "@/pages/Index";
import { addQuoteToDatabase, updateQuoteInDatabase, deleteQuoteFromDatabase } from "@/services/quoteService";

export const useQuoteActions = (
  clients: Client[],
  fetchQuotes: () => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const addQuote = async (newQuote: Omit<Quote, "id">) => {
    if (!user) return;
    
    const result = await addQuoteToDatabase(newQuote, clients, user.id, toast);
    
    if (result) {
      fetchQuotes();
      const client = clients.find(c => c.id === newQuote.clientId);
      toast({
        title: "Quote added",
        description: `Quote for ${client?.name || "client"} has been added successfully.`,
      });
    }
  };

  const updateQuote = async (id: string, updatedQuoteData: Partial<Quote>) => {
    if (!user) return;
    
    // Create a full quote object by merging the updated data
    const fullQuote = { id, ...updatedQuoteData } as Quote;
    
    const result = await updateQuoteInDatabase(fullQuote, clients, user.id, toast);
    
    if (result) {
      fetchQuotes();
      const client = clients.find(c => c.id === fullQuote.clientId);
      toast({
        title: "Quote updated",
        description: `Quote for ${client?.name || "client"} has been updated successfully.`,
      });
    }
  };

  const deleteQuote = async (quoteId: string) => {
    if (!user) return;
    
    const success = await deleteQuoteFromDatabase(quoteId, user.id, toast);
    
    if (success) {
      fetchQuotes();
      toast({
        title: "Quote deleted",
        description: "The quote has been deleted successfully.",
      });
    }
  };

  return {
    addQuote,
    updateQuote,
    deleteQuote
  };
};
