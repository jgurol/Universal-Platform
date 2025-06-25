
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ClientInfo } from "@/pages/Index";

export const useQuoteDialogClientFiltering = (
  open: boolean,
  clientInfos: ClientInfo[],
  userProfile: any
) => {
  const { user } = useAuth();
  const [filteredClientInfos, setFilteredClientInfos] = useState<ClientInfo[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Filter client infos based on user's agent association
  useEffect(() => {
    const filterClientInfos = () => {
      if (!open) {
        console.log('[useQuoteDialogClientFiltering] Dialog closed, clearing filtered clients');
        setFilteredClientInfos([]);
        setIsDataLoading(false);
        return;
      }

      // Always set loading to false once we start filtering
      setIsDataLoading(false);

      // Wait for user profile to be available
      if (userProfile === null) {
        console.log('[useQuoteDialogClientFiltering] Waiting for user profile');
        setFilteredClientInfos([]);
        return;
      }

      const isUserAdmin = userProfile?.role === 'admin';
      console.log('[useQuoteDialogClientFiltering] Filtering clients - isAdmin:', isUserAdmin, 'associatedAgentId:', userProfile?.associated_agent_id);
      console.log('[useQuoteDialogClientFiltering] Total clientInfos available:', clientInfos.length);

      if (isUserAdmin) {
        // Admin sees all clients
        console.log('[useQuoteDialogClientFiltering] Admin user - showing all client infos');
        setFilteredClientInfos(clientInfos);
      } else {
        // For non-admin users, we need to check if they are associated with an agent
        // If they have an associated_agent_id, show clients for that agent
        // If they don't have an associated_agent_id, it means they ARE the agent, so show clients where agent_id matches their user_id
        
        let filtered: ClientInfo[] = [];
        
        if (userProfile?.associated_agent_id) {
          // User is associated with an agent - show clients for that agent
          console.log('[useQuoteDialogClientFiltering] User associated with agent:', userProfile.associated_agent_id);
          filtered = clientInfos.filter(client => {
            const matches = client.agent_id === userProfile.associated_agent_id;
            console.log('[useQuoteDialogClientFiltering] Client', client.company_name, 'agent_id:', client.agent_id, 'matches:', matches);
            return matches;
          });
        } else {
          // User is not associated with an agent, so they might be an agent themselves
          // Check if there are any clients where agent_id matches user_id
          const agentClients = clientInfos.filter(client => client.agent_id === user?.id);
          
          if (agentClients.length > 0) {
            // User is an agent - show their clients
            console.log('[useQuoteDialogClientFiltering] User is an agent - showing their clients');
            filtered = agentClients;
          } else {
            // User is neither admin nor agent - show clients they created (user_id matches)
            console.log('[useQuoteDialogClientFiltering] Regular user - filtering by user_id:', user?.id);
            filtered = clientInfos.filter(client => {
              const matches = client.user_id === user?.id;
              console.log('[useQuoteDialogClientFiltering] Client', client.company_name, 'user_id:', client.user_id, 'current_user:', user?.id, 'matches:', matches);
              return matches;
            });
          }
        }
        
        console.log('[useQuoteDialogClientFiltering] Filtered client infos:', filtered.length, 'clients:', filtered.map(c => c.company_name));
        setFilteredClientInfos(filtered);
      }
    };

    // Always try to filter when dialog opens or clientInfos change
    if (open) {
      filterClientInfos();
    }
  }, [userProfile, clientInfos, open, user?.id]);

  return {
    filteredClientInfos,
    isDataLoading
  };
};
