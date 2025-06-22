
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
  const { quotes, setQuotes, fetchQuotes } = useQuotes();

  useEffect(() => {
    if (user && associatedAgentId !== undefined) {
      Promise.all([
        fetchClients(), 
        fetchQuotes(), 
        fetchClientInfos(user.id, associatedAgentId, isAdmin)
      ])
        .finally(() => setIsLoading(false));
    }
  }, [user, associatedAgentId, isAdmin]);

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
