
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ClientInfo } from "@/types/index";

export const useClientInfos = () => {
  const [clientInfos, setClientInfos] = useState<ClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchClientInfos = async (userId?: string, associatedAgentId?: string | null, adminOverride?: boolean) => {
    const currentUserId = userId || user?.id;
    const currentIsAdmin = adminOverride !== undefined ? adminOverride : isAdmin;
    
    if (!currentUserId) {
      console.log('[useClientInfos] No user ID available');
      setIsLoading(false);
      return;
    }

    try {
      console.log('[useClientInfos] Fetching client infos - userId:', currentUserId, 'isAdmin:', currentIsAdmin, 'associatedAgentId:', associatedAgentId);
      
      let query = supabase
        .from('client_info')
        .select('*');
      
      // Admin users can see all clients
      if (currentIsAdmin) {
        console.log('[useClientInfos] Admin user - no filtering applied');
      } else if (associatedAgentId) {
        // Non-admin users with associated agent - filter by that agent
        console.log('[useClientInfos] Non-admin user with agent - filtering by agent:', associatedAgentId);
        query = query.eq('agent_id', associatedAgentId);
      } else {
        // Non-admin users without agent - show only their own clients
        console.log('[useClientInfos] Non-admin user without agent - filtering by user_id:', currentUserId);
        query = query.eq('user_id', currentUserId);
      }

      const { data, error } = await query.order('company_name');

      if (error) {
        console.error('Error fetching client infos:', error);
        setClientInfos([]);
        return;
      }

      if (data) {
        console.log('[useClientInfos] Successfully fetched', data.length, 'client infos');
        // Transform the data to match ClientInfo interface
        const formattedClientInfos: ClientInfo[] = data.map(info => ({
          id: info.id,
          user_id: info.user_id,
          company_name: info.company_name,
          notes: info.notes,
          revio_id: info.revio_id,
          agent_id: info.agent_id,
          created_at: info.created_at,
          updated_at: info.updated_at,
          commission_override: info.commission_override
        }));

        setClientInfos(formattedClientInfos);
      }
    } catch (err) {
      console.error('Error in fetchClientInfos:', err);
      setClientInfos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[useClientInfos] useEffect triggered - user:', !!user, 'isAdmin:', isAdmin);
    if (user && isAdmin !== undefined) {
      fetchClientInfos();
    }
  }, [user, isAdmin]);

  return {
    clientInfos,
    setClientInfos,
    isLoading,
    refetch: fetchClientInfos,
    fetchClientInfos
  };
};
