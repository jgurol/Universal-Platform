import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Quote, Client, ClientInfo } from "@/pages/Index";

export const useIndexData = () => {
  const { user, isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clientInfos, setClientInfos] = useState<ClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [associatedAgentId, setAssociatedAgentId] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('associated_agent_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else if (data && data.associated_agent_id) {
        setAssociatedAgentId(data.associated_agent_id);
        console.info('[fetchUserProfile] User is associated with agent:', data.associated_agent_id);
      } else {
        console.info('[fetchUserProfile] User is not associated with any agent.');
        setAssociatedAgentId(null);
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
    }
  };

  const fetchClients = async () => {
    if (!user) return;
    
    try {
      console.info('[fetchClients] Fetching clients - isAdmin:', isAdmin, 'associatedAgentId:', associatedAgentId);
      
      let query = supabase.from('agents').select('*');
      
      // If not admin and has associated agent, filter by that agent
      if (!isAdmin && associatedAgentId) {
        query = query.eq('id', associatedAgentId);
      }
      
      const { data: agentsData, error } = await query;
      
      if (error) {
        console.error('Error fetching agents:', error);
        return;
      }

      if (agentsData) {
        const mappedClients = agentsData.map(agent => ({
          id: agent.id,
          firstName: agent.first_name,
          lastName: agent.last_name,
          name: `${agent.first_name} ${agent.last_name}`,
          email: agent.email,
          companyName: agent.company_name,
          commissionRate: agent.commission_rate || 0,
          totalEarnings: agent.total_earnings || 0,
          lastPayment: agent.last_payment || new Date().toISOString(),
        }));
        
        setClients(mappedClients);
        console.info('[fetchClients] Fetched agents:', mappedClients.length);
      }
    } catch (err) {
      console.error('Error in fetchClients:', err);
    }
  };

  const fetchQuotes = async () => {
    if (!user) return;
    
    try {
      console.info('[fetchQuotes] ========== STARTING QUOTE FETCH ==========');
      console.info('[fetchQuotes] User ID:', user.id);
      console.info('[fetchQuotes] isAdmin:', isAdmin, 'associatedAgentId:', associatedAgentId);
      
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
      console.info('[fetchQuotes] Number of quotes returned:', quotesData?.length || 0);

      if (quotesData) {
        const mappedQuotes = quotesData.map(quote => {
          console.info('\n[fetchQuotes] =================== PROCESSING QUOTE ===================');
          console.info('[fetchQuotes] Quote ID:', quote.id);
          console.info('[fetchQuotes] Quote description:', quote.description);
          console.info('[fetchQuotes] Raw quote object from DB:', quote);
          console.info('[fetchQuotes] Quote items array:', quote.quote_items);
          console.info('[fetchQuotes] Quote items count:', quote.quote_items?.length || 0);
          
          // Log each quote item in extreme detail
          if (quote.quote_items && quote.quote_items.length > 0) {
            quote.quote_items.forEach((item, index) => {
              console.info(`\n[fetchQuotes] ---- QUOTE ITEM ${index + 1} DETAILS ----`);
              console.info(`[fetchQuotes] Item ID: ${item.id}`);
              console.info(`[fetchQuotes] Item charge_type: "${item.charge_type}"`);
              console.info(`[fetchQuotes] Item charge_type type: ${typeof item.charge_type}`);
              console.info(`[fetchQuotes] Item total_price: ${item.total_price}`);
              console.info(`[fetchQuotes] Item total_price type: ${typeof item.total_price}`);
              console.info(`[fetchQuotes] Item quantity: ${item.quantity}`);
              console.info(`[fetchQuotes] Item unit_price: ${item.unit_price}`);
              console.info(`[fetchQuotes] Full item object:`, item);
              console.info(`[fetchQuotes] ---- END ITEM ${index + 1} ----\n`);
            });
          } else {
            console.info('[fetchQuotes] NO QUOTE ITEMS FOUND FOR THIS QUOTE!');
          }
          
          // Calculate totals from quote items by charge type with detailed logging
          const allItems = quote.quote_items || [];
          console.info('[fetchQuotes] All items for filtering:', allItems);
          
          const nrcItems = allItems.filter(item => {
            const isNRC = item.charge_type === 'NRC';
            console.info(`[fetchQuotes] Item ${item.id}: charge_type="${item.charge_type}", isNRC=${isNRC}`);
            return isNRC;
          });
          
          const mrcItems = allItems.filter(item => {
            const isMRC = item.charge_type === 'MRC';
            console.info(`[fetchQuotes] Item ${item.id}: charge_type="${item.charge_type}", isMRC=${isMRC}`);
            return isMRC;
          });
          
          console.info('[fetchQuotes] Filtered NRC Items:', nrcItems);
          console.info('[fetchQuotes] Filtered MRC Items:', mrcItems);
          
          const nrcTotal = nrcItems.reduce((total, item) => {
            const itemTotal = item.total_price || 0;
            console.info(`[fetchQuotes] Adding NRC item total: ${itemTotal}, running total: ${total + itemTotal}`);
            return total + itemTotal;
          }, 0);
          
          const mrcTotal = mrcItems.reduce((total, item) => {
            const itemTotal = item.total_price || 0;
            console.info(`[fetchQuotes] Adding MRC item total: ${itemTotal}, running total: ${total + itemTotal}`);
            return total + itemTotal;
          }, 0);
          
          const totalAmount = nrcTotal + mrcTotal;

          console.info('[fetchQuotes] ---- FINAL CALCULATIONS ----');
          console.info(`[fetchQuotes] Quote ${quote.id}:`);
          console.info(`[fetchQuotes]   - NRC Total: ${nrcTotal}`);
          console.info(`[fetchQuotes]   - MRC Total: ${mrcTotal}`);
          console.info(`[fetchQuotes]   - Grand Total: ${totalAmount}`);
          console.info('[fetchQuotes] =================== END QUOTE PROCESSING ===================\n');

          return {
            id: quote.id,
            clientId: quote.client_id || '',
            clientName: clients.find(c => c.id === quote.client_id)?.name || 'Unknown',
            companyName: clients.find(c => c.id === quote.client_id)?.companyName || clients.find(c => c.id === quote.client_id)?.name || 'Unknown',
            amount: totalAmount, // Use calculated total from quote items
            date: quote.date,
            description: quote.description || '',
            quoteNumber: quote.quote_number || undefined,
            quoteMonth: quote.quote_month || undefined,
            quoteYear: quote.quote_year || undefined,
            status: quote.status || 'pending',
            commission: quote.commission || 0,
            clientInfoId: quote.client_info_id || undefined,
            clientCompanyName: clientInfos.find(ci => ci.id === quote.client_info_id)?.company_name,
            commissionOverride: quote.commission_override || undefined,
            expiresAt: quote.expires_at || undefined,
            notes: quote.notes || undefined,
            quoteItems: quote.quote_items || []
          };
        });
        
        setQuotes(mappedQuotes);
        console.info('[fetchQuotes] ========== FINAL RESULTS ==========');
        console.info('[fetchQuotes] Final mapped quotes count:', mappedQuotes.length);
        console.info('[fetchQuotes] Final mapped quotes:', mappedQuotes);
        console.info('[fetchQuotes] ========== END QUOTE FETCH ==========');
      }
    } catch (err) {
      console.error('Error in fetchQuotes:', err);
    }
  };

  const fetchClientInfos = async () => {
    if (!user) return;

    try {
      console.info('[fetchClientInfos] Starting client info fetch - isAdmin:', isAdmin, 'associatedAgentId:', associatedAgentId);

      let query = supabase
        .from('client_info')
        .select('*');

      if (!isAdmin && associatedAgentId) {
        console.info('[fetchClientInfos] Non-admin user - filtering by agent:', associatedAgentId);
        query = query.eq('agent_id', associatedAgentId);
      } else {
        console.info('[fetchClientInfos] Admin user - no filtering applied');
      }

      const { data: clientInfosData, error } = await query;

      if (error) {
        console.error('Error fetching client infos:', error);
        return;
      }

      if (clientInfosData) {
        setClientInfos(clientInfosData);
        console.info('[fetchClientInfos] Fetched client infos:', clientInfosData.length);
      }
    } catch (err) {
      console.error('Error in fetchClientInfos:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchClients(), fetchQuotes(), fetchClientInfos()])
        .finally(() => setIsLoading(false));
    }
  }, [user, isAdmin, associatedAgentId]);

  return {
    clients,
    setClients,
    quotes,
    setQuotes,
    clientInfos,
    setClientInfos,
    isLoading,
    associatedAgentId,
    fetchClients,
    fetchQuotes,
    fetchClientInfos
  };
};
