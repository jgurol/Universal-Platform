
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
      console.info('[fetchQuotes] Current user ID:', user.id);
      
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
        console.info('[fetchQuotes] Non-admin user - filtering by agent through client_info:', associatedAgentId);
        // Filter quotes where the client_info is assigned to this agent
        const { data: clientInfoIds } = await supabase
          .from('client_info')
          .select('id')
          .eq('agent_id', associatedAgentId);
        
        console.info('[fetchQuotes] Client info IDs for agent:', clientInfoIds);
        
        if (clientInfoIds && clientInfoIds.length > 0) {
          const clientIds = clientInfoIds.map(ci => ci.id);
          console.info('[fetchQuotes] Filtering quotes by client_info_ids:', clientIds);
          query = query.in('client_info_id', clientIds);
        } else {
          // If no client_info records for this agent, return empty
          console.info('[fetchQuotes] No client_info records found for agent, returning empty');
          setQuotes([]);
          return;
        }
      } else if (!isAdmin) {
        // If user is not admin but has no associated agent, show only their own quotes
        console.info('[fetchQuotes] Non-admin user with no agent - filtering by user_id:', user.id);
        query = query.eq('user_id', user.id);
      } else {
        console.info('[fetchQuotes] Admin user - no filtering applied');
      }
      
      const { data: quotesData, error } = await query;
      
      if (error) {
        console.error('Error fetching quotes:', error);
        return;
      }

      console.info('[fetchQuotes] Raw quotesData from database:', quotesData);
      console.info('[fetchQuotes] Quote numbers in result:', quotesData?.map(q => q.quote_number));
      
      if (quotesData) {
        // Get unique user IDs from quotes to fetch profiles separately
        const userIds = [...new Set(quotesData.map(quote => quote.user_id).filter(Boolean))];
        console.info('[fetchQuotes] User IDs found in quotes:', userIds);
        
        // Fetch user profiles separately
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }
        
        console.info('[fetchQuotes] Profiles fetched:', profiles);
        
        // Create a map of user_id to profile data
        const profileMap = profiles ? profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>) : {};
        
        const mappedQuotes = quotesData.map(quote => {
          // Add profile data to quote for mapping
          const quoteWithProfile = {
            ...quote,
            user_profile: profileMap[quote.user_id] || null
          };
          
          const mapped = mapQuoteData(quoteWithProfile, clients, clientInfos);
          console.log(`[fetchQuotes] Mapped quote ${quote.id} - Number: "${quote.quote_number}", Status: "${mapped.status}", Description: "${mapped.description}"`);
          console.log(`[fetchQuotes] Quote user profile:`, quoteWithProfile.user_profile);
          return mapped;
        });
        
        setQuotes(mappedQuotes);
        console.info('[fetchQuotes] Final mapped quotes count:', mappedQuotes.length);
        console.info('[fetchQuotes] Final quote numbers:', mappedQuotes.map(q => q.quoteNumber));
      }
    } catch (err) {
      console.error('Error in fetchQuotes:', err);
    }
  };

  // Add a function to manually refresh quotes (useful after quote acceptance)
  const refreshQuotes = () => {
    console.log('[useQuotes] Manually refreshing quotes...');
    fetchQuotes();
  };

  return {
    quotes,
    setQuotes,
    fetchQuotes,
    refreshQuotes
  };
};
