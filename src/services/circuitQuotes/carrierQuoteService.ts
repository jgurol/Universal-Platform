
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes/types";

export const useCarrierQuoteService = () => {
  const { toast } = useToast();

  const addCarrierQuote = async (circuitQuoteId: string, carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => {
    try {
      const { data, error } = await supabase
        .from('carrier_quotes')
        .insert({
          circuit_quote_id: circuitQuoteId,
          carrier: carrierQuote.carrier,
          type: carrierQuote.type,
          speed: carrierQuote.speed,
          price: carrierQuote.price,
          term: carrierQuote.term,
          notes: carrierQuote.notes,
          color: carrierQuote.color,
          install_fee: carrierQuote.install_fee,
          site_survey_needed: carrierQuote.site_survey_needed,
          no_service: carrierQuote.no_service,
          static_ip: carrierQuote.static_ip
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding carrier quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Carrier quote added successfully"
      });

      return {
        id: data.id,
        circuit_quote_id: data.circuit_quote_id,
        carrier: data.carrier,
        type: data.type,
        speed: data.speed,
        price: data.price,
        notes: data.notes || '',
        term: data.term || '',
        color: data.color,
        install_fee: data.install_fee || false,
        site_survey_needed: data.site_survey_needed || false,
        no_service: data.no_service || false,
        static_ip: data.static_ip || false
      };
    } catch (error) {
      console.error('Error in addCarrierQuote:', error);
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
          term: carrierQuote.term,
          notes: carrierQuote.notes,
          color: carrierQuote.color,
          install_fee: carrierQuote.install_fee,
          site_survey_needed: carrierQuote.site_survey_needed,
          no_service: carrierQuote.no_service,
          static_ip: carrierQuote.static_ip,
          updated_at: new Date().toISOString()
        })
        .eq('id', carrierQuote.id);

      if (error) {
        console.error('Error updating carrier quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Carrier quote updated successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error in updateCarrierQuote:', error);
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
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Carrier quote deleted successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error in deleteCarrierQuote:', error);
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
