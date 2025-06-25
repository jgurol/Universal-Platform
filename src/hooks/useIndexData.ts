
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useClients } from "@/hooks/useClients";
import { useClientInfos } from "@/hooks/useClientInfos";
import { useQuotes } from "@/hooks/useQuotes";

export const useIndexData = () => {
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Use individual hooks for different data concerns
  const { associatedAgentId } = useUserProfile();
  const { clients, setClients, fetchClients } = useClients();
  const { clientInfos, setClientInfos, fetchClientInfos } = useClientInfos();
  const { quotes, setQuotes, fetchQuotes } = useQuotes(associatedAgentId, clients, clientInfos);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        console.log('[useIndexData] No user available, skipping data load');
        setIsLoading(false);
        return;
      }

      if (associatedAgentId === undefined) {
        console.log('[useIndexData] Still waiting for associatedAgentId to be resolved');
        return;
      }

      console.log('[useIndexData] Starting data load for user:', user.id, 'isAdmin:', isAdmin, 'associatedAgentId:', associatedAgentId);
      
      try {
        setIsLoading(true);

        // Fetch clients and clientInfos in parallel
        const [clientsResult] = await Promise.allSettled([
          fetchClients(),
          fetchClientInfos(user.id, associatedAgentId, isAdmin)
        ]);

        // Log the results
        if (clientsResult.status === 'rejected') {
          console.error('[useIndexData] Failed to fetch clients:', clientsResult.reason);
        } else {
          console.log('[useIndexData] Clients fetched successfully');
        }

        // Give a moment for clientInfos to be set in state, then fetch quotes
        setTimeout(() => {
          console.log('[useIndexData] Fetching quotes with clientInfos length:', clientInfos.length);
          fetchQuotes();
        }, 100);

      } catch (error) {
        console.error('[useIndexData] Error during data loading:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, associatedAgentId, isAdmin]);

  // Debug log when clientInfos changes
  useEffect(() => {
    console.log('[useIndexData] clientInfos updated, length:', clientInfos.length);
    if (clientInfos.length > 0) {
      console.log('[useIndexData] clientInfos sample:', clientInfos.slice(0, 3).map(c => ({ id: c.id, name: c.company_name })));
    }
  }, [clientInfos]);

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
    fetchClientInfos: (userId?: string, associatedAgentId?: string | null, isAdmin?: boolean) => 
      fetchClientInfos(userId, associatedAgentId, isAdmin)
  };
};
