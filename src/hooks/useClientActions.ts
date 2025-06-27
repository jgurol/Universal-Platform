
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Client } from "@/pages/Index";

export const useClientActions = (
  clients: Client[],
  setClients: (clients: Client[]) => void,
  fetchClients: () => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Function to add a new client to Supabase
  const addClient = async (newClient: Omit<Client, "id" | "totalEarnings" | "lastPayment">) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          first_name: newClient.firstName,
          last_name: newClient.lastName,
          email: newClient.email,
          company_name: newClient.companyName,
          commission_rate: newClient.commissionRate,
          user_id: user.id,
          total_earnings: 0,
          last_payment: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding agent:', error);
        toast({
          title: "Failed to add agent",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      } else if (data) {
        // Map the returned data to our Client interface
        const newClientWithId: Client = {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          companyName: data.company_name,
          commissionRate: data.commission_rate,
          totalEarnings: data.total_earnings || 0,
          lastPayment: data.last_payment ? new Date(data.last_payment).toISOString() : new Date().toISOString()
        };

        setClients([...clients, newClientWithId]);

        // Send agent agreement email with the actual agent ID
        try {
          const { error: emailError } = await supabase.functions.invoke('send-agent-agreement', {
            body: {
              agentId: data.id,
              agentEmail: data.email,
              agentName: `${data.first_name} ${data.last_name}`,
              commissionRate: data.commission_rate
            }
          });

          if (emailError) {
            console.error('Error sending agent agreement email:', emailError);
            toast({
              title: "Agent added but email failed",
              description: "The agent was added successfully, but we couldn't send the agreement email.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Agent added and email sent!",
              description: `${newClientWithId.name} has been added and will receive an agreement email shortly.`,
            });
          }
        } catch (emailError) {
          console.error('Error sending agreement email:', emailError);
          toast({
            title: "Agent added but email failed",
            description: "The agent was added successfully, but we couldn't send the agreement email.",
            variant: "destructive"
          });
        }

        return newClientWithId;
      }
    } catch (err) {
      console.error('Error in add client operation:', err);
      toast({
        title: "Error",
        description: "Failed to add agent",
        variant: "destructive"
      });
      throw err;
    }
  };

  // Function to update a client in Supabase
  const updateClient = async (updatedClient: Client) => {
    // Update locally first
    setClients(clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
  };

  // Function to delete a client
  const deleteClient = async (clientId: string) => {
    setClients(clients.filter(client => client.id !== clientId));
  };

  return {
    addClient,
    updateClient,
    deleteClient
  };
};
