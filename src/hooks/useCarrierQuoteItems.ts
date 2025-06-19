
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
  no_service: boolean; // Added no_service field
}

export const useCarrierQuoteItems = (clientInfoId: string | null) => {
  const [carrierQuoteItems, setCarrierQuoteItems] = useState<CarrierQuoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCarrierQuoteItems = async () => {
      console.log('[useCarrierQuoteItems] Starting fetch with:', { user: user?.id, clientInfoId });
      
      if (!user || !clientInfoId) {
        console.log('[useCarrierQuoteItems] Missing user or clientInfoId, clearing items');
        setCarrierQuoteItems([]);
        return;
      }

      setLoading(true);
      try {
        console.log('[useCarrierQuoteItems] Fetching ALL circuit quotes for client to debug:', clientInfoId);
        
        // First, let's see ALL circuit quotes for this client (regardless of status)
        const { data: allCircuitQuotes, error: allCircuitError } = await supabase
          .from('circuit_quotes')
          .select('id, client_name, location, status, client_info_id')
          .eq('user_id', user.id)
          .eq('client_info_id', clientInfoId);

        if (allCircuitError) {
          console.error('[useCarrierQuoteItems] Error fetching all circuit quotes:', allCircuitError);
        } else {
          console.log('[useCarrierQuoteItems] ALL circuit quotes for this client:', allCircuitQuotes);
          console.log('[useCarrierQuoteItems] Circuit quotes by status:', 
            allCircuitQuotes?.reduce((acc, quote) => {
              acc[quote.status] = (acc[quote.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          );
        }

        // Now get circuit quotes for this client that are completed
        const { data: circuitQuotes, error: circuitError } = await supabase
          .from('circuit_quotes')
          .select('id, client_name, location, status')
          .eq('user_id', user.id)
          .eq('client_info_id', clientInfoId)
          .eq('status', 'completed');

        if (circuitError) {
          console.error('[useCarrierQuoteItems] Error fetching circuit quotes:', circuitError);
          return;
        }

        console.log('[useCarrierQuoteItems] Found COMPLETED circuit quotes:', circuitQuotes);

        if (!circuitQuotes || circuitQuotes.length === 0) {
          console.log('[useCarrierQuoteItems] No completed circuit quotes found for this client');
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
