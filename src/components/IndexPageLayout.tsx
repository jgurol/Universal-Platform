
import { useState, useEffect } from "react";
import { NavigationBar } from "@/components/NavigationBar";
import { Header } from "@/components/Header";
import { ProgramsGrid } from "@/components/ProgramsGrid";
import { AddClientDialog } from "@/components/AddClientDialog";
import { Client, Quote, ClientInfo } from "@/types/index";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building } from "lucide-react";

export const IndexPageLayout = () => {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [associatedAgentId, setAssociatedAgentId] = useState<string | null>(null);
  const [associatedAgentInfo, setAssociatedAgentInfo] = useState<{
    name: string;
    company: string;
    email: string;
  } | null>(null);
  const { isAdmin, user } = useAuth();

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
        .select('first_name, last_name, company_name, email')
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
          email: data.email || ''
        });
      }
    } catch (err) {
      console.error('[fetchAssociatedAgentInfo] Exception fetching agent info:', err);
    }
  };

  // Placeholder functions for now - these will be implemented when the full dashboard functionality is needed
  const handleAddClient = async (client: Omit<Client, "id" | "totalEarnings" | "lastPayment">) => {
    console.log('Add client:', client);
  };

  const handleFetchClients = async () => {
    console.log('Fetch clients');
  };

  return (
    <>
      <NavigationBar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
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
                  {associatedAgentInfo.email && (
                    <div className="text-sm text-gray-600">
                      Contact: {associatedAgentInfo.email}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Programs Grid */}
          <ProgramsGrid />
        </div>

        {/* Add Client Dialog */}
        {isAdmin && (
          <AddClientDialog 
            open={isAddClientOpen}
            onOpenChange={setIsAddClientOpen}
            onAddClient={handleAddClient}
            onFetchClients={handleFetchClients}
          />
        )}
      </div>
    </>
  );
};
