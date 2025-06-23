
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Quote, Client, ClientInfo } from "@/types/index";

export const useIndexData = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clientInfos, setClientInfos] = useState<ClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [associatedAgentId, setAssociatedAgentId] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchClients = async () => {
    if (!user) return;

    try {
      let query = supabase.from('agents').select('*');
      
      if (!isAdmin && associatedAgentId) {
        query = query.eq('id', associatedAgentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: "Error",
          description: "Failed to fetch clients",
          variant: "destructive"
        });
      } else {
        const clientsData = (data || []).map(agent => ({
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
        setClients(clientsData);
      }
    } catch (err) {
      console.error('Error in fetchClients:', err);
    }
  };

  const fetchQuotes = async () => {
    if (!user) return;

    try {
      // First fetch quotes
      let quotesQuery = supabase
        .from('quotes')
        .select(`
          *,
          client_info:client_info_id(*)
        `)
        .eq('archived', false);

      if (!isAdmin && associatedAgentId) {
        quotesQuery = quotesQuery.eq('client_id', associatedAgentId);
      }

      const { data: quotesData, error: quotesError } = await quotesQuery.order('created_at', { ascending: false });

      if (quotesError) {
        console.error('Error fetching quotes:', quotesError);
        toast({
          title: "Error",
          description: "Failed to fetch quotes",
          variant: "destructive"
        });
        return;
      }

      // Get unique user_ids from quotes
      const userIds = [...new Set(quotesData?.map(q => q.user_id).filter(Boolean))];
      
      // Fetch profiles for these users
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Create a map of user_id to profile
      const profilesMap = profilesData.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);

      console.log('Fetched quotes with profiles:', quotesData?.map(q => ({ 
        id: q.id, 
        user_id: q.user_id, 
        profile: profilesMap[q.user_id] 
      })));

      const transformedQuotes = (quotesData || []).map(quote => {
        const profile = profilesMap[quote.user_id];
        return {
          id: quote.id,
          clientId: quote.client_id || "",
          clientName: quote.client_info?.company_name || 'Unknown Client',
          companyName: quote.client_info?.company_name || '',
          clientInfoId: quote.client_info_id,
          amount: parseFloat(String(quote.amount || 0)),
          date: quote.date,
          description: quote.description || "",
          status: quote.status || 'pending',
          user_id: quote.user_id,
          salespersonName: profile?.full_name || profile?.email || 'Sales Team',
          quoteNumber: quote.quote_number,
          quoteMonth: quote.quote_month,
          quoteYear: quote.quote_year,
          commission: parseFloat(String(quote.commission || 0)),
          commissionOverride: quote.commission_override ? parseFloat(String(quote.commission_override)) : undefined,
          expiresAt: quote.expires_at,
          notes: quote.notes,
          quoteItems: [],
          billingAddress: quote.billing_address,
          serviceAddress: quote.service_address,
          templateId: quote.template_id,
          acceptanceStatus: quote.acceptance_status,
          acceptedAt: quote.accepted_at,
          acceptedBy: quote.accepted_by,
          archived: quote.archived || false
        };
      });
      setQuotes(transformedQuotes);
    } catch (err) {
      console.error('Error in fetchQuotes:', err);
    }
  };

  const fetchClientInfos = async () => {
    if (!user) return;

    try {
      let query = supabase.from('client_info').select('*');
      
      if (!isAdmin && associatedAgentId) {
        query = query.eq('agent_id', associatedAgentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching client infos:', error);
        toast({
          title: "Error",
          description: "Failed to fetch client information",
          variant: "destructive"
        });
      } else {
        setClientInfos(data || []);
      }
    } catch (err) {
      console.error('Error in fetchClientInfos:', err);
    }
  };

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

  useEffect(() => {
    const initializeData = async () => {
      if (user) {
        setIsLoading(true);
        await fetchUserProfile();
        await Promise.all([
          fetchClients(),
          fetchQuotes(),
          fetchClientInfos()
        ]);
        setIsLoading(false);
      }
    };

    initializeData();
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
