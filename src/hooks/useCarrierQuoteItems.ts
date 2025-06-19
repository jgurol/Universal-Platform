
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
        // First, let's see what client info we're looking for
        console.log('[useCarrierQuoteItems] Looking for client_info_id:', clientInfoId);
        
        // Get the client info details
        const { data: clientInfo, error: clientInfoError } = await supabase
          .from('client_info')
          .select('id, company_name')
          .eq('id', clientInfoId)
          .single();
          
        if (clientInfoError) {
          console.error('[useCarrierQuoteItems] Error fetching client info:', clientInfoError);
        } else {
          console.log('[useCarrierQuoteItems] Found client info:', clientInfo);
        }

        // Let's check ALL circuit quotes in the system to debug
        const { data: allCircuitQuotesDebug, error: allDebugError } = await supabase
          .from('circuit_quotes')
          .select('id, client_name, location, status, client_info_id, user_id');

        if (allDebugError) {
          console.error('[useCarrierQuoteItems] Error fetching all circuit quotes for debugging:', allDebugError);
        } else {
          console.log('[useCarrierQuoteItems] ALL circuit quotes in system:', allCircuitQuotesDebug);
          
          // Find quotes that match the client name
          const quotesWithMatchingName = allCircuitQuotesDebug?.filter(q => 
            q.client_name.toLowerCase().includes('easterseals') || 
            q.client_name.toLowerCase().includes('southern california')
          );
          console.log('[useCarrierQuoteItems] Circuit quotes with matching client name:', quotesWithMatchingName);
          
          // Check if any quotes belong to current user
          const userQuotes = allCircuitQuotesDebug?.filter(q => q.user_id === user.id);
          console.log('[useCarrierQuoteItems] Current user\'s circuit quotes:', userQuotes);
        }

        // Now let's see ALL circuit quotes for this user (to debug)
        const { data: allUserCircuitQuotes, error: allUserError } = await supabase
          .from('circuit_quotes')
          .select('id, client_name, location, status, client_info_id')
          .eq('user_id', user.id);

        if (allUserError) {
          console.error('[useCarrierQuoteItems] Error fetching all user circuit quotes:', allUserError);
        } else {
          console.log('[useCarrierQuoteItems] ALL circuit quotes for this user:', allUserCircuitQuotes);
          console.log('[useCarrierQuoteItems] Looking for client_info_id match:', clientInfoId);
          const matchingQuotes = allUserCircuitQuotes?.filter(q => q.client_info_id === clientInfoId);
          console.log('[useCarrierQuoteItems] Matching circuit quotes for this client_info_id:', matchingQuotes);
        }

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
