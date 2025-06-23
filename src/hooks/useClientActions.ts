
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/index";
import { useToast } from "@/hooks/use-toast";

export const useClientActions = (
  clients: Client[],
  setClients: (clients: Client[]) => void,
  fetchClients: () => Promise<void>
) => {
  const { toast } = useToast();

  const addClient = async (clientData: Omit<Client, "id" | "totalEarnings" | "lastPayment">) => {
    try {
      console.log('Adding client with data:', clientData);
      
      const { data, error } = await supabase
        .from('agents')
        .insert([{
          first_name: clientData.name.split(' ')[0] || clientData.name,
          last_name: clientData.name.split(' ').slice(1).join(' ') || '',
          email: clientData.email,
          company_name: clientData.companyName || '',
          commission_rate: clientData.commissionRate || 0,
          total_earnings: 0,
          last_payment: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding client:', error);
        throw error;
      }

      console.log('Client added successfully:', data);
      
      // Refresh the clients list
      await fetchClients();
      
      toast({
        title: "Success",
        description: "Client added successfully!",
      });

      return data;
    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    addClient
  };
};
