
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
    if (!user) {
      console.error('❌ No user found when trying to add agent');
      return;
    }
    
    try {
      console.log('🚀 Starting agent addition process...');
      console.log('👤 User ID:', user.id);
      console.log('📝 Agent data:', newClient);
      
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
        console.error('❌ Database error adding agent:', error);
        toast({
          title: "Failed to add agent",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      } 
      
      if (!data) {
        console.error('❌ No data returned from agent insert');
        throw new Error('No data returned from database');
      }

      console.log('✅ Agent added to database successfully:', data);
      
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
      
      console.log('📧 Email payload prepared:', emailPayload);
      console.log('🔧 Supabase client status:', !!supabase);
      console.log('🔧 Supabase functions available:', !!supabase.functions);

      // Test if we can access supabase functions
      try {
        console.log('🧪 Testing supabase functions access...');
        
        // Call the edge function to send agreement email
        console.log('📡 Invoking send-agent-agreement function...');
        
        const functionResponse = await supabase.functions.invoke('send-agent-agreement', {
          body: emailPayload
        });

        console.log('📧 Function invocation completed');
        console.log('📧 Response:', functionResponse);
        console.log('📧 Response data:', functionResponse.data);
        console.log('📧 Response error:', functionResponse.error);

        if (functionResponse.error) {
          console.error('❌ Function invocation error:', functionResponse.error);
          console.error('❌ Error type:', typeof functionResponse.error);
          console.error('❌ Error details:', JSON.stringify(functionResponse.error, null, 2));
          
          toast({
            title: "Agent added but email failed",
            description: `The agent was added successfully, but we couldn't send the agreement email: ${functionResponse.error.message || 'Unknown error'}`,
            variant: "destructive"
          });
        } else if (functionResponse.data?.success) {
          console.log('✅ Email sent successfully:', functionResponse.data);
          toast({
            title: "Agent added and email sent!",
            description: `${newClientWithId.name} has been added and will receive an agreement email shortly.`,
          });
        } else {
          console.error('❌ Email function returned failure:', functionResponse.data);
          toast({
            title: "Agent added but email failed",
            description: `The agent was added successfully, but the email service returned an error: ${functionResponse.data?.error || 'Unknown error'}`,
            variant: "destructive"
          });
        }
      } catch (emailError) {
        console.error('💥 Exception when calling email function:', emailError);
        console.error('💥 Exception type:', typeof emailError);
        console.error('💥 Exception constructor:', emailError?.constructor?.name);
        
        if (emailError instanceof Error) {
          console.error('💥 Error name:', emailError.name);
          console.error('💥 Error message:', emailError.message);
          console.error('💥 Error stack:', emailError.stack);
        } else {
          console.error('💥 Non-Error exception:', emailError);
        }
        
        toast({
          title: "Agent added but email failed",
          description: `The agent was added successfully, but there was an exception calling the email service: ${emailError instanceof Error ? emailError.message : 'Network error occurred'}`,
          variant: "destructive"
        });
      }

      return newClientWithId;
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
