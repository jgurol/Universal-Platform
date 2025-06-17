
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface CarrierQuoteItem {
  id: string;
  carrier: string;
  type: string;
  speed: string;
  price: number;
  term: string;
  notes?: string;
  circuit_quote_id: string;
  client_name: string;
  location: string; // Added location from circuit quote
}

export const useCarrierQuoteItems = (clientInfoId: string | null) => {
  const [carrierQuoteItems, setCarrierQuoteItems] = useState<CarrierQuoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCarrierQuoteItems = async () => {
      if (!user || !clientInfoId) {
        setCarrierQuoteItems([]);
        return;
      }

      setLoading(true);
      try {
        // Get circuit quotes for this client that are completed
        const { data: circuitQuotes, error: circuitError } = await supabase
          .from('circuit_quotes')
          .select('id, client_name, location')
          .eq('user_id', user.id)
          .eq('client_info_id', clientInfoId)
          .eq('status', 'completed');

        if (circuitError) {
          console.error('Error fetching circuit quotes:', circuitError);
          return;
        }

        if (!circuitQuotes || circuitQuotes.length === 0) {
          setCarrierQuoteItems([]);
          return;
        }

        // Get carrier quotes for these circuit quotes
        const circuitQuoteIds = circuitQuotes.map(cq => cq.id);
        const { data: carrierQuotes, error: carrierError } = await supabase
          .from('carrier_quotes')
          .select('*')
          .in('circuit_quote_id', circuitQuoteIds);

        if (carrierError) {
          console.error('Error fetching carrier quotes:', carrierError);
          return;
        }

        if (carrierQuotes) {
          const items = carrierQuotes.map(cq => {
            const circuitQuote = circuitQuotes.find(circ => circ.id === cq.circuit_quote_id);
            return {
              id: cq.id,
              carrier: cq.carrier,
              type: cq.type,
              speed: cq.speed,
              price: cq.price,
              term: cq.term,
              notes: cq.notes,
              circuit_quote_id: cq.circuit_quote_id,
              client_name: circuitQuote?.client_name || '',
              location: circuitQuote?.location || ''
            };
          });
          setCarrierQuoteItems(items);
        }
      } catch (error) {
        console.error('Error in fetchCarrierQuoteItems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarrierQuoteItems();
  }, [user, clientInfoId]);

  return { carrierQuoteItems, loading };
};
