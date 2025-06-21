
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { saveCircuitQuoteCategories } from "./circuitQuoteCategoriesService";
import type { CircuitQuote } from "@/hooks/useCircuitQuotes/types";

export const useCircuitQuoteService = () => {
  const { toast } = useToast();

  const addQuote = async (newQuote: Omit<CircuitQuote, "id" | "created_at" | "carriers" | "categories">, userId: string, categories: string[] = []) => {
    try {
      const { data, error } = await supabase
        .from('circuit_quotes')
        .insert({
          user_id: userId,
          client_name: newQuote.client_name,
          client_info_id: newQuote.client_info_id,
          deal_registration_id: newQuote.deal_registration_id, // Include deal registration ID
          location: newQuote.location,
          suite: newQuote.suite,
          status: newQuote.status,
          static_ip: newQuote.static_ip,
          slash_29: newQuote.slash_29,
          dhcp: newQuote.dhcp,
          mikrotik_required: newQuote.mikrotik_required
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding circuit quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      // Save categories if provided
      if (categories.length > 0) {
        await saveCircuitQuoteCategories(data.id, categories);
      }

      toast({
        title: "Success",
        description: "Circuit quote created successfully"
      });

      return data;
    } catch (error) {
      console.error('Error in addQuote:', error);
      toast({
        title: "Error",
        description: "Failed to create circuit quote",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateQuote = async (updatedQuote: CircuitQuote) => {
    try {
      const { error } = await supabase
        .from('circuit_quotes')
        .update({
          client_name: updatedQuote.client_name,
          client_info_id: updatedQuote.client_info_id,
          deal_registration_id: updatedQuote.deal_registration_id, // Include deal registration ID in updates
          location: updatedQuote.location,
          suite: updatedQuote.suite,
          status: updatedQuote.status,
          static_ip: updatedQuote.static_ip,
          slash_29: updatedQuote.slash_29,
          dhcp: updatedQuote.dhcp,
          mikrotik_required: updatedQuote.mikrotik_required,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedQuote.id);

      if (error) {
        console.error('Error updating circuit quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Update categories
      await saveCircuitQuoteCategories(updatedQuote.id, updatedQuote.categories || []);

      toast({
        title: "Success",
        description: "Circuit quote updated successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error in updateQuote:', error);
      toast({
        title: "Error",
        description: "Failed to update circuit quote",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('circuit_quotes')
        .delete()
        .eq('id', quoteId);

      if (error) {
        console.error('Error deleting circuit quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Circuit quote deleted successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error in deleteQuote:', error);
      toast({
        title: "Error",
        description: "Failed to delete circuit quote",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    addQuote,
    updateQuote,
    deleteQuote
  };
};
