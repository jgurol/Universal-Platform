
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
  location: string;
  no_service: boolean;
}

export const useCarrierQuoteItems = (clientInfoId: string | null) => {
  const [carrierQuoteItems, setCarrierQuoteItems] = useState<CarrierQuoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCarrierQuoteItems = async () => {
      console.log('[useCarrierQuoteItems] Starting fetch with clientInfoId:', clientInfoId);
      
      if (!user) {
        console.log('[useCarrierQuoteItems] Missing user, clearing items');
        setCarrierQuoteItems([]);
        return;
      }

      setLoading(true);
      try {
        let circuitQuotes;
        let circuitError;

        if (clientInfoId) {
          // Get circuit quotes for this specific client, including ones with NULL client_info_id
          const { data, error } = await supabase
            .from('circuit_quotes')
            .select('id, client_name, location, status')
            .or(`client_info_id.eq.${clientInfoId},client_info_id.is.null`)
            .eq('status', 'completed');
          
          circuitQuotes = data;
          circuitError = error;
        } else {
          // If no specific client selected, get all completed circuit quotes
          const { data, error } = await supabase
            .from('circuit_quotes')
            .select('id, client_name, location, status')
            .eq('status', 'completed');
          
          circuitQuotes = data;
          circuitError = error;
        }

        if (circuitError) {
          console.error('[useCarrierQuoteItems] Error fetching circuit quotes:', circuitError);
          return;
        }

        console.log('[useCarrierQuoteItems] Found circuit quotes:', circuitQuotes);

        if (!circuitQuotes || circuitQuotes.length === 0) {
          console.log('[useCarrierQuoteItems] No circuit quotes found');
          setCarrierQuoteItems([]);
          return;
        }

        // Get carrier quotes for these circuit quotes
        const circuitQuoteIds = circuitQuotes.map(cq => cq.id);
        console.log('[useCarrierQuoteItems] Fetching carrier quotes for circuit quote IDs:', circuitQuoteIds);
        
        const { data: carrierQuotes, error: carrierError } = await supabase
          .from('carrier_quotes')
          .select('*')
          .in('circuit_quote_id', circuitQuoteIds);

        if (carrierError) {
          console.error('[useCarrierQuoteItems] Error fetching carrier quotes:', carrierError);
          return;
        }

        console.log('[useCarrierQuoteItems] Found carrier quotes:', carrierQuotes);

        if (carrierQuotes) {
          const items = carrierQuotes.map(cq => {
            const circuitQuote = circuitQuotes.find(circ => circ.id === cq.circuit_quote_id);
            const item = {
              id: cq.id,
              carrier: cq.carrier,
              type: cq.type,
              speed: cq.speed,
              price: cq.price,
              term: cq.term,
              notes: cq.notes,
              circuit_quote_id: cq.circuit_quote_id,
              client_name: circuitQuote?.client_name || '',
              location: circuitQuote?.location || '',
              no_service: cq.no_service || false
            };
            console.log('[useCarrierQuoteItems] Created item:', item);
            return item;
          });
          
          console.log('[useCarrierQuoteItems] Final carrier quote items:', items);
          setCarrierQuoteItems(items);
        }
      } catch (error) {
        console.error('[useCarrierQuoteItems] Error in fetchCarrierQuoteItems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarrierQuoteItems();
  }, [user, clientInfoId]);

  return { carrierQuoteItems, loading };
};
