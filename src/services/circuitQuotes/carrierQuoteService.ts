
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";

export const useCarrierQuoteService = () => {
  const { toast } = useToast();

  const addCarrierQuote = async (circuitQuoteId: string, carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => {
    try {
      // Get the current max display_order for this circuit quote
      const { data: existingCarriers } = await supabase
        .from('carrier_quotes')
        .select('display_order')
        .eq('circuit_quote_id', circuitQuoteId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextDisplayOrder = existingCarriers && existingCarriers.length > 0 
        ? (existingCarriers[0].display_order || 0) + 1 
        : 1;

      const { data, error } = await supabase
        .from('carrier_quotes')
        .insert({
          circuit_quote_id: circuitQuoteId,
          ...carrierQuote,
          display_order: nextDisplayOrder
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding carrier quote:', error);
        toast({
          title: "Error",
          description: "Failed to add carrier quote",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Carrier quote added successfully",
      });

      return data;
    } catch (error) {
      console.error('Unexpected error adding carrier quote:', error);
      toast({
        title: "Error",
        description: "Failed to add carrier quote",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateCarrierQuote = async (carrierQuote: CarrierQuote) => {
    try {
      const { error } = await supabase
        .from('carrier_quotes')
        .update({
          carrier: carrierQuote.carrier,
          type: carrierQuote.type,
          speed: carrierQuote.speed,
          price: carrierQuote.price,
          notes: carrierQuote.notes,
          term: carrierQuote.term,
          color: carrierQuote.color,
          install_fee: carrierQuote.install_fee,
          site_survey_needed: carrierQuote.site_survey_needed,
          no_service: carrierQuote.no_service,
          static_ip: carrierQuote.static_ip
        })
        .eq('id', carrierQuote.id);

      if (error) {
        console.error('Error updating carrier quote:', error);
        toast({
          title: "Error",
          description: "Failed to update carrier quote",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Carrier quote updated successfully",
      });

      return true;
    } catch (error) {
      console.error('Unexpected error updating carrier quote:', error);
      toast({
        title: "Error",
        description: "Failed to update carrier quote",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCarrierQuote = async (carrierId: string) => {
    try {
      const { error } = await supabase
        .from('carrier_quotes')
        .delete()
        .eq('id', carrierId);

      if (error) {
        console.error('Error deleting carrier quote:', error);
        toast({
          title: "Error",
          description: "Failed to delete carrier quote",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Carrier quote deleted successfully",
      });

      return true;
    } catch (error) {
      console.error('Unexpected error deleting carrier quote:', error);
      toast({
        title: "Error",
        description: "Failed to delete carrier quote",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    addCarrierQuote,
    updateCarrierQuote,
    deleteCarrierQuote
  };
};
