
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useClients } from "@/hooks/useClients";
import { useClientInfos } from "@/hooks/useClientInfos";
import { useQuotes } from "@/hooks/useQuotes";

export const useIndexData = () => {
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Use individual hooks for different data concerns
  const { associatedAgentId } = useUserProfile();
  const { clients, setClients, fetchClients } = useClients();
  const { clientInfos, setClientInfos, fetchClientInfos } = useClientInfos();
  const { quotes, setQuotes, fetchQuotes } = useQuotes(associatedAgentId, clients, clientInfos);

  useEffect(() => {
    // Reset fetch attempted when user changes to allow refetch
    if (user?.id) {
      setFetchAttempted(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Prevent multiple fetch attempts and only run when we have proper auth info
    if (user && associatedAgentId !== undefined && !fetchAttempted) {
      console.log('useIndexData - Starting data fetch for user:', user.id, 'agent:', associatedAgentId);
      setFetchAttempted(true);
      
      // First load clients and clientInfos in parallel
      Promise.all([
        fetchClients().catch(err => {
          console.error('Failed to fetch clients:', err);
          return []; // Return empty array on error to prevent retry
        }), 
        fetchClientInfos(user.id, associatedAgentId, isAdmin).catch(err => {
          console.error('Failed to fetch client infos:', err);
          return []; // Return empty array on error to prevent retry
        })
      ])
        .then(() => {
          console.log('useIndexData - Clients and client infos loaded, fetching quotes');
          // After clients and clientInfos are loaded, fetch quotes
          return fetchQuotes().catch(err => {
            console.error('Failed to fetch quotes:', err);
            return []; // Return empty array on error to prevent retry
          });
        })
        .then(() => {
          console.log('useIndexData - All data fetched successfully');
        })
        .catch(err => {
          console.error('useIndexData - Error in data fetching chain:', err);
        })
        .finally(() => {
          console.log('useIndexData - Setting loading to false');
          setIsLoading(false);
        });
    }
  }, [user?.id, associatedAgentId, isAdmin, fetchAttempted]);

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
