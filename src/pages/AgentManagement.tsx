import { useState, useEffect } from "react";
import { NavigationBar } from "@/components/NavigationBar";
import { Header } from "@/components/Header";
import { ClientList } from "@/components/ClientList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Client, Transaction } from "@/pages/Index";
import { useAuth } from "@/context/AuthContext";
import { User, Building, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AgentManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [associatedAgentId, setAssociatedAgentId] = useState<string | null>(null);
  const [associatedAgentInfo, setAssociatedAgentInfo] = useState<{
    name: string;
    company: string;
    email: string;
    commissionRate: number;
  } | null>(null);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  // Fetch the associated agent ID for the current user
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Fetch user's profile to get associated agent ID
  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('associated_agent_id')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        console.error('[fetchUserProfile] Error fetching user profile:', error);
        return;
      }
      
      console.log("[fetchUserProfile] User profile data:", data);
      setAssociatedAgentId(data?.associated_agent_id || null);
      
      // If user has an associated agent, fetch agent details
      if (data?.associated_agent_id) {
        fetchAssociatedAgentInfo(data.associated_agent_id);
      }
    } catch (err) {
      console.error('[fetchUserProfile] Exception fetching user profile:', err);
    }
  };

  // Fetch associated agent information
  const fetchAssociatedAgentInfo = async (agentId: string) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('first_name, last_name, company_name, email, commission_rate')
        .eq('id', agentId)
        .single();
      
      if (error) {
        console.error('[fetchAssociatedAgentInfo] Error fetching agent info:', error);
        return;
      }
      
      if (data) {
        setAssociatedAgentInfo({
          name: `${data.first_name} ${data.last_name}`,
          company: data.company_name || '',
          email: data.email || '',
          commissionRate: data.commission_rate || 0
        });
      }
    } catch (err) {
      console.error('[fetchAssociatedAgentInfo] Exception fetching agent info:', err);
    }
  };

  // Load clients from Supabase when component mounts
  useEffect(() => {
    if (associatedAgentId !== undefined) {
      fetchClients();
    }
  }, [associatedAgentId]);

  // Function to fetch transactions from Supabase
  useEffect(() => {
    if (clients.length > 0) {
      fetchTransactions();
    }
  }, [clients]);

  // Function to fetch clients from Supabase
  const fetchClients = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // If admin, fetch all agents, otherwise fetch only the associated agent
      let query = supabase.from('agents').select('*');
      
      // If user is not admin and has an associated agent, filter by that agent ID
      if (!isAdmin && associatedAgentId) {
        query = query.eq('id', associatedAgentId);
      }
      
      query = query.order('last_name', { ascending: true });
      
      const { data, error } = await query;

      if (error) {
        console.error('[fetchClients] Error fetching agents:', error);
        toast({
          title: "Failed to load agents",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log("[fetchClients] Fetched agents:", data);

      // Map the data to match our Client interface
      const mappedClients: Client[] = data?.map(agent => ({
        id: agent.id,
        firstName: agent.first_name,
        lastName: agent.last_name,
        name: `${agent.first_name} ${agent.last_name}`,
        email: agent.email,
        companyName: agent.company_name,
        commissionRate: agent.commission_rate,
        totalEarnings: agent.total_earnings || 0,
        lastPayment: agent.last_payment ? new Date(agent.last_payment).toISOString() : new Date().toISOString()
      })) || [];

      setClients(mappedClients);
    } catch (err) {
      console.error('[fetchClients] Error in client fetch:', err);
      toast({
        title: "Error",
        description: "Failed to load agent data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch transactions from Supabase (using quotes table)
  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      // Fetch quotes instead of transactions
      let query = supabase.from('quotes').select('*');
      
      if (isAdmin) {
        // Admins see everything
      } else if (associatedAgentId) {
        query = query.eq('client_id', associatedAgentId);
      } else {
        // For non-admin users without agent ID, use a condition that will never match
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching quotes:', error);
        return;
      }

      // Map the quotes data to match our Transaction interface for backward compatibility
      const mappedTransactions: Transaction[] = data?.map(quote => {
        const client = clients.find(c => c.id === quote.client_id);
        
        return {
          id: quote.id,
          clientId: quote.client_id,
          clientName: client?.name || "Unknown Agent",
          companyName: client?.companyName || "Unknown Company",
          amount: quote.amount,
          date: quote.date,
          description: quote.description,
          // Map quote fields to transaction fields for backward compatibility
          datePaid: quote.status === 'approved' ? quote.date : undefined,
          paymentMethod: quote.status === 'approved' ? 'Quote' : undefined,
          referenceNumber: quote.quote_number,
          invoiceMonth: quote.quote_month,
          invoiceYear: quote.quote_year,
          invoiceNumber: quote.quote_number,
          isPaid: quote.status === 'approved',
          commission: quote.commission,
          isApproved: quote.status === 'approved',
          clientInfoId: quote.client_info_id,
          commissionPaidDate: quote.status === 'approved' ? quote.date : undefined
        };
      }) || [];

      setTransactions(mappedTransactions);
    } catch (err) {
      console.error('Error in transaction fetch:', err);
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

  return (
    <div>
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <Header />
        
        {/* Associated Agent Info Card - Show for non-admin users */}
        {!isAdmin && associatedAgentInfo && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg border-0 mt-8 mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Your Associated Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <User className="w-3 h-3 mr-1" />
                    {associatedAgentInfo.name}
                  </Badge>
                </div>
                {associatedAgentInfo.company && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Building className="w-3 h-3 mr-1" />
                      {associatedAgentInfo.company}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Percent className="w-3 h-3 mr-1" />
                    {associatedAgentInfo.commissionRate}% Commission
                  </Badge>
                </div>
                {associatedAgentInfo.email && (
                  <div className="text-sm text-gray-600">
                    Contact: {associatedAgentInfo.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="bg-white shadow-lg border-0 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Salesperson Management</CardTitle>
            <CardDescription>View and manage commission salespersons and their rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientList 
              clients={clients} 
              transactions={transactions}
              onUpdateClient={updateClient}
              onDeleteClient={deleteClient}
              onUpdateTransactions={setTransactions}
              onFetchClients={fetchClients}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
