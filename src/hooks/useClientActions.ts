import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Client } from "@/types/index";

interface UseClientActionsProps {
  onClientsChange?: (clients: Client[]) => void;
}

export const useClientActions = ({ onClientsChange }: UseClientActionsProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const addClient = async (newClient: Omit<Client, 'id'>) => {
    setIsLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...newClient, user_id: user.id }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Client added successfully.",
      });

      // Fetch updated clients and update state
      const { data: updatedClients, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      if (onClientsChange) {
        onClientsChange(updatedClients || []);
      }
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add client.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (updatedClient: Client) => {
    setIsLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('clients')
        .update(updatedClient)
        .eq('id', updatedClient.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Client updated successfully.",
      });

      // Fetch updated clients and update state
      const { data: updatedClients, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      if (onClientsChange) {
        onClientsChange(updatedClients || []);
      }
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update client.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (clientId: string) => {
    setIsLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Client deleted successfully.",
      });

      // Fetch updated clients and update state
      const { data: updatedClients, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw fetchError;
      }

      if (onClientsChange) {
        onClientsChange(updatedClients || []);
      }
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete client.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { addClient, updateClient, deleteClient, isLoading };
};
