
import { useState, useEffect } from "react";
import { ClientInfo } from "@/pages/Index";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAgentMapping } from "@/hooks/useAgentMapping";
import { clientInfoService } from "@/services/clientInfoService";
import { ClientManagementHook } from "@/types/clientManagement";
import { supabase } from "@/integrations/supabase/client";

export const useClientManagement = (): ClientManagementHook => {
  const [clientInfos, setClientInfos] = useState<ClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [associatedAgentId, setAssociatedAgentId] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { agentMapping } = useAgentMapping();

  // Fetch the associated agent ID for the current user
  useEffect(() => {
    const fetchAssociatedAgentId = async () => {
      if (!user || isAdmin) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('associated_agent_id')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        setAssociatedAgentId(data?.associated_agent_id || null);
      } catch (err) {
        console.error('Exception fetching associated agent:', err);
      }
    };

    fetchAssociatedAgentId();
  }, [user, isAdmin]);

  // Load client info from Supabase
  useEffect(() => {
    const fetchClientInfos = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('[useClientManagement] Fetching client infos - isAdmin:', isAdmin, 'associatedAgentId:', associatedAgentId);
        const data = await clientInfoService.fetchClientInfos(user.id, associatedAgentId, isAdmin);
        console.log('[useClientManagement] Fetched client infos:', data.length);
        setClientInfos(data);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        toast({
          title: "Failed to load clients",
          description: err instanceof Error ? err.message : "Failed to load client information",
          variant: "destructive"
        });
      }
    };

    // Only fetch when we have the associated agent ID (for non-admins) or when user is admin
    if (isAdmin || associatedAgentId !== null) {
      fetchClientInfos();
    }
  }, [user, isAdmin, associatedAgentId, toast]);

  // Function to add client info
  const addClientInfo = async (newClientInfo: Omit<ClientInfo, "id" | "created_at" | "updated_at" | "user_id">) => {
    if (!user) return;

    try {
      const data = await clientInfoService.addClientInfo(newClientInfo, user.id);
      
      toast({
        title: "Client added",
        description: `${data.company_name} has been added successfully.`,
        variant: "default"
      });
      setClientInfos([...clientInfos, data]);
    } catch (err) {
      console.error('Error in add client operation:', err);
      toast({
        title: "Failed to add client",
        description: err instanceof Error ? err.message : "Failed to add client information",
        variant: "destructive"
      });
    }
  };

  // Function to update client info
  const updateClientInfo = async (updatedClientInfo: ClientInfo) => {
    if (!user) return;

    // Check if this is a delete operation (special case)
    if ((updatedClientInfo as any)._delete) {
      setClientInfos(clientInfos.filter(ci => ci.id !== updatedClientInfo.id));
      return;
    }

    try {
      const data = await clientInfoService.updateClientInfo(updatedClientInfo);
      
      toast({
        title: "Client updated",
        description: `${data.company_name} has been updated successfully.`,
        variant: "default"
      });
      setClientInfos(clientInfos.map(ci => ci.id === data.id ? data : ci));
    } catch (err) {
      console.error('Error in update client operation:', err);
      toast({
        title: "Failed to update client",
        description: err instanceof Error ? err.message : "Failed to update client information",
        variant: "destructive"
      });
    }
  };

  return {
    clientInfos,
    isLoading,
    agentMapping,
    addClientInfo,
    updateClientInfo
  };
};
