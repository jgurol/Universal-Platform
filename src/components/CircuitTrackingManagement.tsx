
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useCircuitTracking } from "@/hooks/useCircuitTracking";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Zap } from "lucide-react";

const STAGES = [
  'Ready to Order',
  'Ordered',
  'Order Acknowledged',
  'Site Survey',
  'Build in Progress',
  "Jepp'd",
  'FOC',
  'Pending Install',
  'IP Assigned',
  'Router Install',
  'Setup Autopay',
  'Add to Circuit Management',
  'Demark Extension',
  'Activation',
  'Documentation',
  'Ready for Billing',
  'Billed'
];

const getProgressFromStage = (stage: string): number => {
  const index = STAGES.indexOf(stage);
  if (index === -1) return 0;
  return Math.round((index / (STAGES.length - 1)) * 100);
};

export const CircuitTrackingManagement = () => {
  const { circuitTrackings, isLoading, updateCircuitStage, addMilestone } = useCircuitTracking();
  const { toast } = useToast();
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    milestone_name: '',
    milestone_description: '',
    target_date: '',
    status: 'pending' as const
  });

  const handleStageUpdate = async (circuitId: string, newStage: string) => {
    try {
      await updateCircuitStage(circuitId, newStage);
      toast({
        title: "Stage Updated",
        description: "Circuit stage has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stage. Please try again.",
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

  const formatLocation = (address: any) => {
    if (!address) return '-';
    const parts = [];
    if (address.street_address) parts.push(address.street_address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
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
              No orders with quote items found. Order tracking is automatically created when quotes are approved.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTrackings).map(([orderId, trackings]) => {
                // Get customer name and quote number from the first tracking item's quote data
                const firstTracking = trackings[0];
                const customerName = firstTracking?.quote_item?.quote?.client_info?.company_name || 
                                   firstTracking?.quote_item?.quote?.accepted_by || 
                                   'Unknown Customer';
                const quoteNumber = firstTracking?.quote_item?.quote?.quote_number || 
                                  `Q-${firstTracking?.quote_item?.quote?.id?.slice(0, 8) || 'Unknown'}`;
                
                return (
                  <div key={orderId} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h3 className="font-semibold">
                        Order: {trackings[0]?.order?.order_number || orderId.slice(0, 8)} | 
                        Customer: {customerName} | 
                        Quote: {quoteNumber}
                      </h3>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Item Name</TableHead>
                          <TableHead className="w-[250px]">Location</TableHead>
                          <TableHead className="w-[80px]">Qty</TableHead>
                          <TableHead className="w-[100px]">Unit Price</TableHead>
                          <TableHead className="w-[150px]">Progress</TableHead>
                          <TableHead className="w-[150px]">Stage</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trackings.map((circuit) => {
                          const progress = getProgressFromStage(circuit.stage || 'Ready to Order');
                          return (
                            <TableRow key={circuit.id}>
                              <TableCell className="font-medium">
                                {circuit.item_name || circuit.quote_item?.item?.name || circuit.circuit_type}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {formatLocation(circuit.quote_item?.address)}
                              </TableCell>
                              <TableCell>
                                {circuit.quote_item?.quantity || '-'}
                              </TableCell>
                              <TableCell>
                                ${circuit.quote_item?.unit_price || '0'}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <Progress value={progress} className="h-2" />
                                  <span className="text-xs text-gray-500">{progress}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={circuit.stage || 'Ready to Order'}
                                  onValueChange={(value) => handleStageUpdate(circuit.id, value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STAGES.map((stage) => (
                                      <SelectItem key={stage} value={stage}>
                                        {stage}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => setSelectedCircuit(circuit.id)}
                                    >
                                      <Plus className="w-3 h-3" />
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
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
