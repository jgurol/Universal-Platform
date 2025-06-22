
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ClientInfo } from "@/types/index";

export const useClientInfos = () => {
  const [clientInfos, setClientInfos] = useState<ClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchClientInfos = async (userId?: string, associatedAgentId?: string | null, isAdmin?: boolean) => {
    const currentUserId = userId || user?.id;
    if (!currentUserId) {
      console.log('useClientInfos - No user ID available');
      setIsLoading(false);
      return;
    }

    console.log('useClientInfos - fetchClientInfos called with:', { currentUserId, associatedAgentId, isAdmin });

    try {
      let query = supabase
        .from('client_info')
        .select(`
          id,
          user_id,
          company_name,
          notes,
          revio_id,
          agent_id,
          created_at,
          updated_at,
          commission_override
        `);
      
      // If not admin and has associated agent, filter by that agent
      if (!isAdmin && associatedAgentId) {
        query = query.eq('agent_id', associatedAgentId);
      } else if (!isAdmin) {
        // If user is not admin but has no associated agent, show only their own client infos
        query = query.eq('user_id', currentUserId);
      }

      const { data, error } = await query.order('company_name');

      console.log('useClientInfos - Query result:', { count: data?.length || 0, error });

      if (error) {
        console.error('Error fetching client infos:', error);
        setClientInfos([]);
        return;
      }

      if (data) {
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

        console.log('useClientInfos - Setting client infos:', formattedClientInfos.length);
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
    if (user?.id) {
      fetchClientInfos();
    }
  }, [user?.id]);

  return {
    clientInfos,
    setClientInfos,
    isLoading,
    refetch: fetchClientInfos,
    fetchClientInfos
  };
};
