import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { saveCircuitQuoteCategories } from "./circuitQuoteCategoriesService";
import type { CircuitQuote } from "@/hooks/useCircuitQuotes/types";

export const useCircuitQuoteService = () => {
  const { toast } = useToast();

  const addQuote = async (newQuote: Omit<CircuitQuote, "id" | "created_at" | "carriers" | "categories">, userId: string, categories: string[] = []) => {
    try {
      // Validate that the client_info_id exists and is accessible before creating the quote
      if (newQuote.client_info_id) {
        const { data: clientExists, error: clientCheckError } = await supabase
          .from('client_info')
          .select('id')
          .eq('id', newQuote.client_info_id)
          .single();

        if (clientCheckError || !clientExists) {
          console.error('Client validation error:', clientCheckError);
          toast({
            title: "Error",
            description: "Selected client is not accessible or does not exist",
            variant: "destructive"
          });
          return null;
        }
      }

      const { data, error } = await supabase
        .from('circuit_quotes')
        .insert({
          user_id: userId,
          client_name: newQuote.client_name,
          client_info_id: newQuote.client_info_id,
          deal_registration_id: newQuote.deal_registration_id,
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
        if (error.code === '23503') {
          toast({
            title: "Error",
            description: "Selected client or deal registration is not valid. Please refresh and try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
        }
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
      // Get the current quote to check for status change
      const { data: currentQuote, error: fetchError } = await supabase
        .from('circuit_quotes')
        .select('status')
        .eq('id', updatedQuote.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current quote:', fetchError);
        toast({
          title: "Error",
          description: "Failed to fetch current quote status",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('circuit_quotes')
        .update({
          client_name: updatedQuote.client_name,
          client_info_id: updatedQuote.client_info_id,
          deal_registration_id: updatedQuote.deal_registration_id,
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

      // Check if status changed to 'completed' and send notification
      if (currentQuote.status !== 'completed' && updatedQuote.status === 'completed') {
        console.log('Status changed to completed, sending notification...');
        try {
          const { error: notificationError } = await supabase.functions.invoke('send-completion-notification', {
            body: {
              circuitQuoteId: updatedQuote.id
            }
          });

          if (notificationError) {
            console.error('Error sending completion notification:', notificationError);
            // Don't fail the update if notification fails
            toast({
              title: "Warning",
              description: "Quote updated but agent notification failed to send",
              variant: "destructive"
            });
          } else {
            console.log('Completion notification sent successfully');
          }
        } catch (notificationError) {
          console.error('Error invoking completion notification function:', notificationError);
          // Don't fail the update if notification fails
        }
      }

      toast({
        title: "Success",
        description: updatedQuote.status === 'completed' ? 
          "Circuit quote completed and agent notified!" : 
          "Circuit quote updated successfully"
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
