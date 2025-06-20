
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, DollarSign, Calendar, TrendingUp, Target, Building2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { dealRegistrationService, DealRegistration, AddDealData } from "@/services/dealRegistrationService";
import { AddDealDialog } from "@/components/AddDealDialog";
import { EditDealDialog } from "@/components/EditDealDialog";
import { ClientInfo } from "@/pages/Index";

interface DealRegistrationCardProps {
  clientInfos: ClientInfo[];
  agentMapping: Record<string, string>;
}

export const DealRegistrationCard = ({ clientInfos, agentMapping }: DealRegistrationCardProps) => {
  const [deals, setDeals] = useState<DealRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealRegistration | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user]);

  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      const data = await dealRegistrationService.fetchDeals();
      setDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: "Failed to load deals",
        description: "There was an error loading your deal registrations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDeal = async (newDeal: AddDealData) => {
    if (!user) return;

    try {
      const data = await dealRegistrationService.addDeal(newDeal, user.id);
      setDeals([data, ...deals]);
      toast({
        title: "Deal created",
        description: `${data.deal_name} has been registered successfully.`,
      });
    } catch (error) {
      console.error('Error adding deal:', error);
      toast({
        title: "Failed to create deal",
        description: "There was an error creating the deal registration",
        variant: "destructive"
      });
    }
  };

  const updateDeal = async (updatedDeal: DealRegistration) => {
    try {
      const data = await dealRegistrationService.updateDeal(updatedDeal);
      setDeals(deals.map(deal => deal.id === data.id ? data : deal));
      toast({
        title: "Deal updated",
        description: `${data.deal_name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: "Failed to update deal",
        description: "There was an error updating the deal",
        variant: "destructive"
      });
    }
  };

  const deleteDeal = async (deal: DealRegistration) => {
    if (window.confirm(`Are you sure you want to delete "${deal.deal_name}"?`)) {
      try {
        await dealRegistrationService.deleteDeal(deal.id);
        setDeals(deals.filter(d => d.id !== deal.id));
        toast({
          title: "Deal deleted",
          description: `${deal.deal_name} has been deleted successfully.`,
        });
      } catch (error) {
        console.error('Error deleting deal:', error);
        toast({
          title: "Failed to delete deal",
          description: "There was an error deleting the deal",
          variant: "destructive"
        });
      }
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting':
        return 'bg-gray-100 text-gray-800';
      case 'qualification':
        return 'bg-blue-100 text-blue-800';
      case 'proposal':
        return 'bg-yellow-100 text-yellow-800';
      case 'negotiation':
        return 'bg-orange-100 text-orange-800';
      case 'closed-won':
        return 'bg-green-100 text-green-800';
      case 'closed-lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
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

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clientInfos.find(c => c.id === clientId);
    return client?.company_name || 'Unknown Client';
  };

  const totalDealValue = deals.reduce((sum, deal) => sum + deal.deal_value, 0);
  const activeDealCount = deals.filter(deal => deal.status === 'active').length;
  const avgProbability = deals.length > 0 ? deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length : 0;

  if (isLoading) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading deals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Deal Registration
              </CardTitle>
              <CardDescription>Track and manage your sales opportunities</CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddDealOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Register Deal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-green-800">
                    ${totalDealValue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Active Deals</p>
                  <p className="text-2xl font-bold text-blue-800">{activeDealCount}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Avg. Probability</p>
                  <p className="text-2xl font-bold text-purple-800">{avgProbability.toFixed(0)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Deals List */}
          <div className="space-y-4">
            {deals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No deals registered yet. Click "Register Deal" to get started!</p>
              </div>
            ) : (
              deals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex flex-col p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{deal.deal_name}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1).replace('-', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(deal.status)}>
                          {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {deal.probability}% Probability
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDeal(deal)}
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDeal(deal)}
                        className="hover:bg-red-50 hover:border-red-300 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">${deal.deal_value.toLocaleString()}</span>
                    </div>
                    
                    {deal.expected_close_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Close: {new Date(deal.expected_close_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {deal.client_info_id && getClientName(deal.client_info_id) && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{getClientName(deal.client_info_id)}</span>
                      </div>
                    )}
                    
                    {deal.agent_id && agentMapping[deal.agent_id] && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{agentMapping[deal.agent_id]}</span>
                      </div>
                    )}
                  </div>
                  
                  {deal.description && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-700">{deal.description}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddDealDialog
        open={isAddDealOpen}
        onOpenChange={setIsAddDealOpen}
        onAddDeal={addDeal}
        clientInfos={clientInfos}
      />

      {editingDeal && (
        <EditDealDialog
          open={!!editingDeal}
          onOpenChange={(open) => !open && setEditingDeal(null)}
          onUpdateDeal={updateDeal}
          deal={editingDeal}
          clientInfos={clientInfos}
        />
      )}
    </>
  );
};
