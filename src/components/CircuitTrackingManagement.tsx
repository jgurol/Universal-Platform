
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCircuitTracking } from "@/hooks/useCircuitTracking";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap, Package } from "lucide-react";

export const CircuitTrackingManagement = () => {
  const { circuitTrackings, isLoading, updateCircuitProgress, addMilestone } = useCircuitTracking();
  const { toast } = useToast();
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    milestone_name: '',
    milestone_description: '',
    target_date: '',
    status: 'pending' as const
  });

  const handleProgressUpdate = async (circuitId: string, newProgress: number) => {
    try {
      await updateCircuitProgress(circuitId, newProgress);
      toast({
        title: "Progress Updated",
        description: "Circuit progress has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddMilestone = async () => {
    if (!selectedCircuit || !newMilestone.milestone_name) return;
    
    try {
      await addMilestone(selectedCircuit, newMilestone);
      setNewMilestone({
        milestone_name: '',
        milestone_description: '',
        target_date: '',
        status: 'pending'
      });
      toast({
        title: "Milestone Added",
        description: "New milestone has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add milestone. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'installation': return 'bg-purple-100 text-purple-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group circuit trackings by order
  const groupedTrackings = circuitTrackings.reduce((acc, tracking) => {
    const orderId = tracking.order_id;
    if (!acc[orderId]) {
      acc[orderId] = [];
    }
    acc[orderId].push(tracking);
    return acc;
  }, {} as Record<string, typeof circuitTrackings>);

  if (isLoading) {
    return <div>Loading circuit tracking...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Circuit Progress Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {circuitTrackings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No circuit orders found. Circuit tracking is automatically created when quotes with broadband, dedicated fiber, fixed wireless, or 4G/5G items are approved.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTrackings).map(([orderId, trackings]) => (
                <Card key={orderId} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order: {trackings[0]?.order?.order_number || orderId.slice(0, 8)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {trackings.map((circuit) => (
                        <Card key={circuit.id} className="bg-gray-50">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-semibold text-lg">
                                  {circuit.item_name || circuit.quote_item?.item?.name || circuit.circuit_type.charAt(0).toUpperCase() + circuit.circuit_type.slice(1).replace('_', ' ')}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Type: {circuit.circuit_type.charAt(0).toUpperCase() + circuit.circuit_type.slice(1).replace('_', ' ')}
                                </p>
                                {(circuit.item_description || circuit.quote_item?.item?.description) && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {circuit.item_description || circuit.quote_item?.item?.description}
                                  </p>
                                )}
                                {circuit.quote_item?.address && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    Service Address: {circuit.quote_item.address.street_address}, {circuit.quote_item.address.city}, {circuit.quote_item.address.state}
                                  </p>
                                )}
                              </div>
                              <Badge className={getStatusColor(circuit.status)}>
                                {circuit.status.charAt(0).toUpperCase() + circuit.status.slice(1).replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <Label>Progress</Label>
                                  <span className="text-sm font-medium">{circuit.progress_percentage}%</span>
                                </div>
                                <Progress value={circuit.progress_percentage} className="h-3" />
                              </div>
                              
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Update progress %"
                                  className="flex-1"
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const value = parseInt((e.target as HTMLInputElement).value);
                                      if (value >= 0 && value <= 100) {
                                        handleProgressUpdate(circuit.id, value);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }
                                  }}
                                />
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedCircuit(circuit.id)}
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Add Milestone
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Add Milestone</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="milestone-name">Milestone Name</Label>
                                        <Input
                                          id="milestone-name"
                                          value={newMilestone.milestone_name}
                                          onChange={(e) => setNewMilestone(prev => ({ ...prev, milestone_name: e.target.value }))}
                                          placeholder="e.g., Site Survey Completed"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="milestone-description">Description</Label>
                                        <Textarea
                                          id="milestone-description"
                                          value={newMilestone.milestone_description}
                                          onChange={(e) => setNewMilestone(prev => ({ ...prev, milestone_description: e.target.value }))}
                                          placeholder="Optional description"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="target-date">Target Date</Label>
                                        <Input
                                          id="target-date"
                                          type="date"
                                          value={newMilestone.target_date}
                                          onChange={(e) => setNewMilestone(prev => ({ ...prev, target_date: e.target.value }))}
                                        />
                                      </div>
                                      <Button onClick={handleAddMilestone} className="w-full">
                                        Add Milestone
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              
                              {circuit.estimated_completion_date && (
                                <p className="text-sm text-gray-600">
                                  Estimated completion: {new Date(circuit.estimated_completion_date).toLocaleDateString()}
                                </p>
                              )}
                              
                              {circuit.notes && (
                                <p className="text-sm bg-gray-50 p-3 rounded">{circuit.notes}</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
