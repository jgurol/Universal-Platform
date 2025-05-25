
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useClients } from "@/hooks/useClients";
import { useClientInfos } from "@/hooks/useClientInfos";
import { useQuotes } from "@/hooks/useQuotes";

export const useIndexData = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Use individual hooks for different data concerns
  const { associatedAgentId } = useUserProfile();
  const { clients, setClients, fetchClients } = useClients(associatedAgentId);
  const { clientInfos, setClientInfos, fetchClientInfos } = useClientInfos(associatedAgentId);
  const { quotes, setQuotes, fetchQuotes } = useQuotes(associatedAgentId, clients, clientInfos);

  useEffect(() => {
    if (user && associatedAgentId !== undefined) {
      Promise.all([fetchClients(), fetchQuotes(), fetchClientInfos()])
        .finally(() => setIsLoading(false));
    }
  }, [user, associatedAgentId]);

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
