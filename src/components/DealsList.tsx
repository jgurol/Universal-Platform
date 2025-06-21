
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { dealRegistrationService, DealRegistration } from "@/services/dealRegistrationService";
import { EditDealDialog } from "@/components/EditDealDialog";
import { AddDealDialog } from "@/components/AddDealDialog";
import { useToast } from "@/hooks/use-toast";
import { ClientInfo } from "@/pages/Index";

interface DealsListProps {
  clientInfos: ClientInfo[];
  agentMapping: Record<string, any>;
}

export const DealsList = ({ clientInfos, agentMapping }: DealsListProps) => {
  const [deals, setDeals] = useState<DealRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDeal, setEditingDeal] = useState<DealRegistration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchDeals();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const fetchedDeals = await dealRegistrationService.fetchDeals();
      setDeals(fetchedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch deals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditDeal = (deal: DealRegistration) => {
    setEditingDeal(deal);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDeal = async (updatedDeal: DealRegistration) => {
    try {
      await dealRegistrationService.updateDeal(updatedDeal);
      setDeals(prev => prev.map(deal => 
        deal.id === updatedDeal.id ? updatedDeal : deal
      ));
      toast({
        title: "Success",
        description: "Deal updated successfully"
      });
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error",
        description: "Failed to update deal",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await dealRegistrationService.deleteDeal(dealId);
      setDeals(prev => prev.filter(deal => deal.id !== dealId));
      toast({
        title: "Success",
        description: "Deal deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast({
        title: "Error",
        description: "Failed to delete deal",
        variant: "destructive"
      });
    }
  };

  const handleAddDeal = async (dealData: any) => {
    try {
      const newDeal = await dealRegistrationService.addDeal(dealData, dealData.user_id);
      setDeals(prev => [newDeal, ...prev]);
      toast({
        title: "Success",
        description: "Deal created successfully"
      });
    } catch (error) {
      console.error('Error adding deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'prospecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualification':
        return 'bg-orange-100 text-orange-800';
      case 'proposal':
        return 'bg-blue-100 text-blue-800';
      case 'negotiation':
        return 'bg-purple-100 text-purple-800';
      case 'closed-won':
        return 'bg-green-100 text-green-800';
      case 'closed-lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientName = (clientInfoId: string | null) => {
    if (!clientInfoId) return 'No Client';
    const client = clientInfos.find(c => c.id === clientInfoId);
    return client?.company_name || 'Unknown Client';
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'No Agent';
    const agent = agentMapping[agentId];
    return agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent';
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading deals...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Deal Registrations</CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No deals found. Create your first deal registration.
            </div>
          ) : (
            <div className="space-y-4">
              {deals.map((deal) => (
                <div key={deal.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{deal.deal_name}</h3>
                        <Badge className={getStageBadgeColor(deal.stage)}>
                          {deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1).replace('-', ' ')}
                        </Badge>
                        <Badge className={getStatusBadgeColor(deal.status)}>
                          {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Value:</span>
                          <p className="font-semibold">${deal.deal_value.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Probability:</span>
                          <p>{deal.probability}%</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Client:</span>
                          <p>{getClientName(deal.client_info_id)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Agent:</span>
                          <p>{getAgentName(deal.agent_id)}</p>
                        </div>
                      </div>
                      
                      {deal.expected_close_date && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-gray-500">Expected Close:</span>
                          <span className="ml-2">{new Date(deal.expected_close_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {deal.description && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-gray-500">Description:</span>
                          <p className="text-gray-700 mt-1">{deal.description}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDeal(deal)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDeal(deal.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditDealDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdateDeal={handleUpdateDeal}
        deal={editingDeal}
        clientInfos={clientInfos}
      />

      <AddDealDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddDeal={handleAddDeal}
        clientInfos={clientInfos}
        agentMapping={agentMapping}
      />
    </>
  );
};
