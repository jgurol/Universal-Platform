
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Client, ClientInfo } from "@/pages/Index";
import { DealRegistration } from "@/services/dealRegistrationService";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

export const useQuoteDialogData = (open: boolean, clients: Client[], clientInfos: ClientInfo[], clientInfoId: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [filteredClientInfos, setFilteredClientInfos] = useState<ClientInfo[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [associatedDeals, setAssociatedDeals] = useState<DealRegistration[]>([]);

  // Fetch user profile and determine access level
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !open) {
        setUserProfile(null);
        return;
      }

      try {
        console.log('[useQuoteDialogData] Fetching user profile for:', user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('associated_agent_id, role, full_name, email')
          .eq('id', user.id)
          .single();

        console.log('[useQuoteDialogData] User profile:', profile);
        setUserProfile(profile);
        setIsAdmin(profile?.role === 'admin');
        
        // Set current user name
        if (profile?.full_name && profile.full_name.trim() !== '') {
          setCurrentUserName(profile.full_name);
        } else if (profile?.email) {
          setCurrentUserName(profile.email);
        } else if (user.email) {
          setCurrentUserName(user.email.split('@')[0]);
        } else {
          setCurrentUserName('Current User');
        }
      } catch (error) {
        console.error('[useQuoteDialogData] Error fetching user profile:', error);
        setUserProfile(null);
        setIsAdmin(false);
        setCurrentUserName(user.email?.split('@')[0] || 'Current User');
      }
    };

    fetchUserProfile();
  }, [user, open]);

  // Filter client infos based on user's agent association
  useEffect(() => {
    const filterClientInfos = () => {
      if (!open) {
        console.log('[useQuoteDialogData] Dialog closed, clearing filtered clients');
        setFilteredClientInfos([]);
        setIsDataLoading(false);
        return;
      }

      // Wait for user profile to be available
      if (!userProfile) {
        console.log('[useQuoteDialogData] Waiting for user profile');
        return;
      }

      // Set loading to false once we have user profile - regardless of client count
      setIsDataLoading(false);

      const isUserAdmin = userProfile.role === 'admin';
      console.log('[useQuoteDialogData] Filtering clients - isAdmin:', isUserAdmin, 'associatedAgentId:', userProfile.associated_agent_id);
      console.log('[useQuoteDialogData] Total clientInfos available:', clientInfos.length);

      if (isUserAdmin) {
        // Admin sees all clients
        console.log('[useQuoteDialogData] Admin user - showing all client infos');
        setFilteredClientInfos(clientInfos);
      } else {
        // For non-admin users, we need to check if they are associated with an agent
        // If they have an associated_agent_id, show clients for that agent
        // If they don't have an associated_agent_id, it means they ARE the agent, so show clients where agent_id matches their user_id
        
        let filtered: ClientInfo[] = [];
        
        if (userProfile.associated_agent_id) {
          // User is associated with an agent - show clients for that agent
          console.log('[useQuoteDialogData] User associated with agent:', userProfile.associated_agent_id);
          filtered = clientInfos.filter(client => {
            const matches = client.agent_id === userProfile.associated_agent_id;
            console.log('[useQuoteDialogData] Client', client.company_name, 'agent_id:', client.agent_id, 'matches:', matches);
            return matches;
          });
        } else {
          // User is not associated with an agent, so they might be an agent themselves
          // Check if there are any clients where agent_id matches user_id
          const agentClients = clientInfos.filter(client => client.agent_id === user?.id);
          
          if (agentClients.length > 0) {
            // User is an agent - show their clients
            console.log('[useQuoteDialogData] User is an agent - showing their clients');
            filtered = agentClients;
          } else {
            // User is neither admin nor agent - show only their own clients
            console.log('[useQuoteDialogData] Regular user - filtering by user_id:', user?.id);
            filtered = clientInfos.filter(client => client.user_id === user?.id);
          }
        }
        
        console.log('[useQuoteDialogData] Filtered client infos:', filtered.length);
        setFilteredClientInfos(filtered);
      }
    };

    // Filter as soon as we have user profile - don't wait for clientInfos
    if (userProfile) {
      filterClientInfos();
    }
  }, [userProfile, clientInfos, open, user?.id]);

  // Fetch deals associated with the selected client
  useEffect(() => {
    const fetchAssociatedDeals = async () => {
      if (!clientInfoId || clientInfoId === "none") {
        setAssociatedDeals([]);
        return;
      }

      try {
        const { data: deals, error } = await supabase
          .from('deal_registrations')
          .select('*')
          .eq('client_info_id', clientInfoId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching associated deals:', error);
          setAssociatedDeals([]);
        } else {
          setAssociatedDeals(deals || []);
        }
      } catch (error) {
        console.error('Error fetching associated deals:', error);
        setAssociatedDeals([]);
      }
    };

    fetchAssociatedDeals();
  }, [clientInfoId]);

  // Load templates when dialog opens and auto-select default
  useEffect(() => {
    const fetchTemplates = async () => {
      if (open && user) {
        console.log('[useQuoteDialogData] Fetching templates for user:', user.id);
        try {
          const { data, error } = await supabase
            .from('quote_templates')
            .select('*')
            .order('name');

          console.log('[useQuoteDialogData] Templates query result:', { data, error });
          
          if (error) {
            console.error('[useQuoteDialogData] Error fetching templates:', error);
            setTemplates([]);
            toast({
              title: "Warning",
              description: "Could not load quote templates. You may need to create one first.",
              variant: "destructive",
            });
            return;
          }
          
          setTemplates(data || []);
          console.log('[useQuoteDialogData] Templates set:', data?.length || 0, 'templates');
        } catch (error) {
          console.error('[useQuoteDialogData] Error loading templates:', error);
          setTemplates([]);
          toast({
            title: "Warning",
            description: "Could not load quote templates. You may need to create one first.",
            variant: "destructive",
          });
        }
      }
    };

    fetchTemplates();
  }, [open, user, toast]);

  return {
    templates,
    setTemplates,
    isDataLoading,
    filteredClientInfos,
    userProfile,
    currentUserName,
    isAdmin,
    associatedDeals,
    setAssociatedDeals
  };
};
