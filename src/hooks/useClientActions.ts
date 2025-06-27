
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
  const addClient = async (newClient: Omit<Client, "id" | "totalEarnings" | "lastPayment"> & { selectedTemplateId?: string }) => {
    if (!user) return;
    
    try {
      console.log('Starting to add new agent...');
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
        console.error('Error adding agent to database:', error);
        toast({
          title: "Failed to add agent",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      } else if (data) {
        console.log('Agent added to database successfully:', data);
        
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

        // Prepare email payload
        const emailPayload = {
          agentId: data.id,
          agentEmail: data.email,
          agentName: `${data.first_name} ${data.last_name}`,
          commissionRate: data.commission_rate,
          templateId: newClient.selectedTemplateId || null
        };
        
        console.log('🚀 About to call send-agent-agreement function');
        console.log('📧 Payload:', emailPayload);
        console.log('🔗 Supabase URL:', supabase.supabaseUrl);

        try {
          // Call the edge function to send agreement email
          console.log('📡 Invoking Supabase function...');
          
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-agent-agreement', {
            body: emailPayload
          });

          console.log('📧 Email function response received');
          console.log('📧 Response data:', emailResult);
          console.log('📧 Response error:', emailError);

          if (emailError) {
            console.error('❌ Supabase function invocation error:', emailError);
            console.error('❌ Error details:', {
              message: emailError.message,
              code: emailError.code,
              details: emailError.details,
              hint: emailError.hint
            });
            toast({
              title: "Agent added but email failed",
              description: `The agent was added successfully, but we couldn't send the agreement email: ${emailError.message}`,
              variant: "destructive"
            });
          } else if (emailResult?.success) {
            console.log('✅ Email sent successfully:', emailResult);
            toast({
              title: "Agent added and email sent!",
              description: `${newClientWithId.name} has been added and will receive an agreement email shortly.`,
            });
          } else {
            console.error('❌ Email function returned failure:', emailResult);
            toast({
              title: "Agent added but email failed",
              description: `The agent was added successfully, but the email service returned an error: ${emailResult?.error || 'Unknown error'}`,
              variant: "destructive"
            });
          }
        } catch (emailError) {
          console.error('💥 Exception when calling email function:', emailError);
          console.error('💥 Exception type:', typeof emailError);
          console.error('💥 Exception constructor:', emailError?.constructor?.name);
          console.error('💥 Exception details:', {
            name: emailError instanceof Error ? emailError.name : 'Unknown',
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : 'No stack trace',
            cause: emailError instanceof Error ? emailError.cause : 'No cause'
          });
          
          toast({
            title: "Agent added but email failed",
            description: `The agent was added successfully, but there was an exception calling the email service: ${emailError instanceof Error ? emailError.message : 'Network error occurred'}`,
            variant: "destructive"
          });
        }

        return newClientWithId;
      }
    } catch (err) {
      console.error('💥 Error in add client operation:', err);
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
