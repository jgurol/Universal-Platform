
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";

export const useCarrierQuoteService = () => {
  const { toast } = useToast();

  const sendAgentNotification = async (carrierQuote: CarrierQuote, circuitQuoteId: string) => {
    try {
      console.log('Attempting to send agent notification for carrier quote:', carrierQuote.id);
      
      // Get circuit quote details for the notification
      const { data: circuitQuote, error: circuitError } = await supabase
        .from('circuit_quotes')
        .select(`
          client_name, 
          location,
          client_info:client_info_id (
            id,
            company_name,
            agent_id,
            agents (
              id,
              email,
              first_name,
              last_name
            )
          )
        `)
        .eq('id', circuitQuoteId)
        .single();

      if (circuitError) {
        console.error('Error fetching circuit quote for notification:', circuitError);
        return;
      }

      if (!circuitQuote) {
        console.log('Circuit quote not found for notification');
        return;
      }

      console.log('Circuit quote data for notification:', {
        client_name: circuitQuote.client_name,
        location: circuitQuote.location,
        client_info: circuitQuote.client_info,
        has_agent: !!circuitQuote.client_info?.agents
      });

      // Check if there's an associated agent
      if (!circuitQuote.client_info?.agents?.email) {
        console.log('No agent email found for circuit quote:', circuitQuoteId);
        console.log('Client info:', circuitQuote.client_info);
        return;
      }

      console.log('Sending notification to agent:', circuitQuote.client_info.agents.email);

      // Call the edge function to send agent notification
      const { data, error } = await supabase.functions.invoke('send-agent-notification', {
        body: {
          carrierQuoteId: carrierQuote.id,
          circuitQuoteId: circuitQuoteId,
          carrier: carrierQuote.carrier,
          price: carrierQuote.price,
          clientName: circuitQuote.client_name,
          location: circuitQuote.location,
        },
      });

      if (error) {
        console.error('Error calling send-agent-notification function:', error);
      } else {
        console.log('Agent notification sent successfully:', data);
      }
    } catch (error) {
      console.error('Error sending agent notification:', error);
      // Don't throw error here as we don't want to block the main operation
    }
  };

  const addCarrierQuote = async (circuitQuoteId: string, carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => {
    try {
      console.log('Adding carrier quote:', { circuitQuoteId, carrier: carrierQuote.carrier, price: carrierQuote.price });
      
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
          other_costs: carrierQuote.other_costs || 0,
          display_order: nextDisplayOrder
        })
        .select('*')
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

      console.log('Carrier quote added successfully:', data);

      // Send agent notification if price is provided (for new quotes with price > 0)
      if (carrierQuote.price > 0) {
        console.log('Sending agent notification for new carrier quote with price > 0');
        await sendAgentNotification(data as CarrierQuote, circuitQuoteId);
      } else {
        console.log('No agent notification sent - price is 0 for new carrier quote');
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
      console.log('Updating carrier quote:', { id: carrierQuote.id, carrier: carrierQuote.carrier, price: carrierQuote.price });
      
      // Get the previous price to check if it was just added
      const { data: previousData } = await supabase
        .from('carrier_quotes')
        .select('price')
        .eq('id', carrierQuote.id)
        .single();

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
          install_fee_amount: carrierQuote.install_fee_amount,
          site_survey_needed: carrierQuote.site_survey_needed,
          no_service: carrierQuote.no_service,
          static_ip: carrierQuote.static_ip,
          static_ip_fee_amount: carrierQuote.static_ip_fee_amount,
          static_ip_5: carrierQuote.static_ip_5,
          static_ip_5_fee_amount: carrierQuote.static_ip_5_fee_amount,
          other_costs: carrierQuote.other_costs || 0
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

      console.log('Carrier quote updated successfully');

      // Send agent notification if price was just added (was 0 or null before, now has a value)
      const previousPrice = previousData?.price || 0;
      console.log('Price change check:', { previousPrice, newPrice: carrierQuote.price });
      
      if (previousPrice === 0 && carrierQuote.price > 0) {
        console.log('Sending agent notification for price update from 0 to', carrierQuote.price);
        await sendAgentNotification(carrierQuote, carrierQuote.circuit_quote_id);
      } else {
        console.log('No agent notification sent - price change condition not met');
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
