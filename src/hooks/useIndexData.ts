
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Client, Quote, ClientInfo } from "@/pages/Index";

export const useIndexData = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clientInfos, setClientInfos] = useState<ClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [associatedAgentId, setAssociatedAgentId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Fetch the associated agent ID for the current user
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Load clients from Supabase when profile is loaded
  useEffect(() => {
    if (profileLoaded) {
      fetchClients();
      fetchClientInfos();
    }
  }, [profileLoaded, associatedAgentId]);

  // Function to fetch quotes from Supabase - only after profile is loaded
  useEffect(() => {
    if (profileLoaded) {
      fetchQuotes();
    }
  }, [profileLoaded, associatedAgentId, isAdmin]);

  // Fetch user's profile to get associated agent ID
  const fetchUserProfile = async () => {
    try {
      console.log('[fetchUserProfile] Fetching user profile for:', user?.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('associated_agent_id, role, is_associated, full_name')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        console.error('[fetchUserProfile] Error fetching user profile:', error);
        setProfileLoaded(true);
        return;
      }
      
      console.log("[fetchUserProfile] User profile data:", data);
      setAssociatedAgentId(data?.associated_agent_id || null);
      setProfileLoaded(true);
    } catch (err) {
      console.error('[fetchUserProfile] Exception fetching user profile:', err);
      setProfileLoaded(true);
    }
  };

  // Function to fetch clients from Supabase
  const fetchClients = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      console.log('[fetchClients] Fetching clients - isAdmin:', isAdmin, 'associatedAgentId:', associatedAgentId);
      
      // If admin, fetch all agents, otherwise fetch only the associated agent
      let query = supabase.from('agents').select('*');
      
      // If user is not admin and has an associated agent, filter by that agent ID
      if (!isAdmin && associatedAgentId) {
        query = query.eq('id', associatedAgentId);
      } else if (!isAdmin && !associatedAgentId) {
        console.log('[fetchClients] Non-admin user with NO associated agent - will return empty results');
      }
      
      query = query.order('last_name', { ascending: true });
      
      const { data, error } = await query;

      if (error) {
        console.error('[fetchClients] Error fetching agents:', error);
        toast({
          title: "Failed to load agents",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log("[fetchClients] Fetched agents:", data?.length || 0);

      // Map the data to match our Client interface
      const mappedClients: Client[] = data?.map(agent => ({
        id: agent.id,
        firstName: agent.first_name,
        lastName: agent.last_name,
        name: `${agent.first_name} ${agent.last_name}`,
        email: agent.email,
        companyName: agent.company_name,
        commissionRate: agent.commission_rate,
        totalEarnings: agent.total_earnings || 0,
        lastPayment: agent.last_payment ? new Date(agent.last_payment).toISOString() : new Date().toISOString()
      })) || [];

      setClients(mappedClients);
    } catch (err) {
      console.error('[fetchClients] Error in client fetch:', err);
      toast({
        title: "Error",
        description: "Failed to load agent data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch client info from Supabase
  const fetchClientInfos = async () => {
    if (!user) return;
    
    try {
      let query = supabase.from('client_info').select('*');
      query = query.order('company_name', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[fetchClientInfos] Error fetching client info:', error);
        toast({
          title: "Failed to load clients",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("[fetchClientInfos] Fetched client infos:", data?.length || 0);
        setClientInfos(data || []);
      }
    } catch (err) {
      console.error('[fetchClientInfos] Error in client info fetch:', err);
      toast({
        title: "Error",
        description: "Failed to load client information",
        variant: "destructive"
      });
    }
  };

  // Function to fetch quotes from Supabase
  const fetchQuotes = async () => {
    if (!user) {
      console.log('[fetchQuotes] No user found, skipping quote fetch');
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log('[fetchQuotes] Starting quote fetch - isAdmin:', isAdmin, 'associatedAgentId:', associatedAgentId);
      
      // Build the query with filtering logic
      let query = supabase.from('quotes').select('*');
      
      // ADMIN USERS: See ALL quotes with NO filtering whatsoever
      if (isAdmin) {
        console.log('[fetchQuotes] Admin user - no filtering applied');
        // Admins see everything - absolutely no WHERE clauses
      } else {
        // NON-ADMIN USERS: Only see quotes where client_id matches their associated agent
        if (associatedAgentId) {
          console.log('[fetchQuotes] Non-admin user - filtering by client_id =', associatedAgentId);
          query = query.eq('client_id', associatedAgentId);
        } else {
          console.log('[fetchQuotes] Non-admin user without agent ID - returning empty results');
          // For non-admin users without agent ID, return empty results
          setQuotes([]);
          setIsLoading(false);
          return;
        }
      }
      
      // Add ordering to ensure consistent results
      query = query.order('created_at', { ascending: false });
      
      // Execute the query
      const { data, error } = await query;

      if (error) {
        console.error('[fetchQuotes] Error fetching quotes:', error);
        toast({
          title: "Failed to load quotes",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('[fetchQuotes] Fetched quotes:', data?.length || 0);

      if (!data || data.length === 0) {
        console.log('[fetchQuotes] No quotes found - setting empty array');
        setQuotes([]);
        setIsLoading(false);
        return;
      }

      // Fetch agent and client info data in parallel
      const [agentResponse, clientInfoResponse] = await Promise.all([
        supabase.from('agents').select('*'),
        supabase.from('client_info').select('*')
      ]);

      const agentData = agentResponse.data || [];
      const clientInfoData = clientInfoResponse.data || [];

      // Map database quotes to our Quote interface
      const mappedQuotes = data.map((quote) => {
        // Find client for this quote
        const client = agentData.find(c => c.id === quote.client_id);
        
        // Find client info for this quote if available
        let clientInfo = null;
        if (quote.client_info_id) {
          clientInfo = clientInfoData.find(ci => ci.id === quote.client_info_id);
        }

        return {
          id: quote.id,
          clientId: quote.client_id,
          clientName: client?.first_name && client?.last_name 
            ? `${client.first_name} ${client.last_name}`
            : "Unknown Agent",
          companyName: client?.company_name || (client?.first_name ? `${client.first_name} ${client.last_name}` : "Unknown Company"),
          amount: quote.amount,
          date: quote.date,
          description: quote.description,
          quoteNumber: quote.quote_number,
          quoteMonth: quote.quote_month,
          quoteYear: quote.quote_year,
          status: quote.status,
          commission: quote.commission,
          clientInfoId: quote.client_info_id,
          clientCompanyName: clientInfo?.company_name,
          commissionOverride: quote.commission_override,
          expiresAt: quote.expires_at,
          notes: quote.notes
        };
      });
      
      console.log('[fetchQuotes] Final mapped quotes count:', mappedQuotes.length);
      setQuotes(mappedQuotes);
    } catch (err) {
      console.error('[fetchQuotes] Exception in quote fetch:', err);
      toast({
        title: "Error",
        description: "Failed to load quote data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
