
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ClientInfo } from "@/pages/Index";

export const useClientInfos = (associatedAgentId: string | null) => {
  const { user, isAdmin } = useAuth();
  const [clientInfos, setClientInfos] = useState<ClientInfo[]>([]);

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

  return {
    clientInfos,
    setClientInfos,
    fetchClientInfos
  };
};
