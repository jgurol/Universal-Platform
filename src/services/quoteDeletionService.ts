
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
