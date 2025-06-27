
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Building, Percent, Edit, Trash2 } from "lucide-react";
import { AddClientDialog } from "@/components/AddClientDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string | null;
  commission_rate: number;
  total_earnings: number;
  last_payment: string | null;
}

export const AgentsManagementTab = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching agents:', error);
        toast({
          title: "Failed to load agents",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setAgents(data || []);
    } catch (err) {
      console.error('Error in agent fetch:', err);
      toast({
        title: "Error",
        description: "Failed to load agent data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addAgent = async (newAgent: any) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          first_name: newAgent.firstName,
          last_name: newAgent.lastName,
          email: newAgent.email,
          company_name: newAgent.companyName,
          commission_rate: newAgent.commissionRate,
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
      } else if (data) {
        setAgents([...agents, data]);
        toast({
          title: "Agent added",
          description: `${data.first_name} ${data.last_name} has been added successfully.`,
        });
      }
    } catch (err) {
      console.error('Error in add agent operation:', err);
      toast({
        title: "Error",
        description: "Failed to add agent",
        variant: "destructive"
      });
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) {
        console.error('Error deleting agent:', error);
        toast({
          title: "Failed to delete agent",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setAgents(agents.filter(agent => agent.id !== agentId));
        toast({
          title: "Agent deleted",
          description: "Agent has been deleted successfully.",
        });
      }
    } catch (err) {
      console.error('Error in delete agent operation:', err);
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading agents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <CardTitle>Agents Management</CardTitle>
          </div>
          <Button 
            onClick={() => setIsAddAgentOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Salesperson
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No agents yet</p>
            <p className="text-sm mb-4">Add your first agent to get started</p>
            <Button onClick={() => setIsAddAgentOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Agent
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {agent.first_name} {agent.last_name}
                      </h4>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        <Percent className="w-3 h-3 mr-1" />
                        {agent.commission_rate}% Commission
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{agent.email}</span>
                      {agent.company_name && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {agent.company_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteAgent(agent.id)}
                    title="Delete Agent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AddClientDialog 
        open={isAddAgentOpen}
        onOpenChange={setIsAddAgentOpen}
        onAddClient={addAgent}
        onFetchClients={fetchAgents}
      />
    </Card>
  );
};
