
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { mapQuoteData } from "@/utils/quoteUtils";

export const useQuotes = (
  associatedAgentId: string | null,
  clients: Client[],
  clientInfos: ClientInfo[]
) => {
  const { user, isAdmin } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const fetchQuotes = async () => {
    if (!user) return;
    
    try {
      console.info('[fetchQuotes] Starting quote fetch - isAdmin:', isAdmin, 'associatedAgentId:', associatedAgentId);
      
      let query = supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            *,
            item:items(*),
            address:client_addresses(*)
          )
        `);
      
      // Apply filtering based on user role
      if (!isAdmin && associatedAgentId) {
        console.info('[fetchQuotes] Non-admin user - filtering by agent:', associatedAgentId);
        query = query.eq('client_id', associatedAgentId);
      } else {
        console.info('[fetchQuotes] Admin user - no filtering applied');
      }
      
      const { data: quotesData, error } = await query;
      
      if (error) {
        console.error('Error fetching quotes:', error);
        return;
      }

      console.info('[fetchQuotes] Raw quotesData from database:', quotesData);
      
      // Log email status values specifically
      if (quotesData) {
        quotesData.forEach((quote, index) => {
          console.log(`[fetchQuotes] Quote ${index} - ID: ${quote.id}, Email Status: "${quote.email_status}", Description: "${quote.description}"`);
        });
      }

      if (quotesData) {
        const mappedQuotes = quotesData.map(quote => {
          const mapped = mapQuoteData(quote, clients, clientInfos);
          console.log(`[fetchQuotes] Mapped quote ${quote.id} - Email Status: "${mapped.email_status}", Description: "${mapped.description}"`);
          return mapped;
        });
        
        setQuotes(mappedQuotes);
        console.info('[fetchQuotes] Final mapped quotes count:', mappedQuotes.length);
        console.info('[fetchQuotes] Final quotes with email status:', mappedQuotes.map(q => ({ id: q.id, email_status: q.email_status, description: q.description })));
      }
    } catch (err) {
      console.error('Error in fetchQuotes:', err);
    }
  };

  return {
    quotes,
    setQuotes,
    fetchQuotes
  };
};
