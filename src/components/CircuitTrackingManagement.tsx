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
import { Plus, Zap, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

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

const GROUPING_OPTIONS = [
  { value: 'order', label: 'Order Number' },
  { value: 'stage', label: 'Stage' },
  { value: 'customer', label: 'Customer' }
];

const getProgressFromStage = (stage: string): number => {
  const index = STAGES.indexOf(stage);
  if (index === -1) return 0;
  return Math.round((index / (STAGES.length - 1)) * 100);
};

const getProgressBarClassName = (stage: string): string => {
  const stageIndex = STAGES.indexOf(stage);
  const jeppIndex = STAGES.indexOf("Jepp'd");
  const focIndex = STAGES.indexOf("FOC");
  
  if (stage === "Jepp'd") {
    return "h-2 [&>div]:bg-red-500";
  }
  if (stage === "FOC" || stageIndex > focIndex) {
    return "h-2 [&>div]:bg-green-500";
  }
  if (stageIndex < jeppIndex) {
    return "h-2 [&>div]:bg-yellow-500";
  }
  return "h-2";
};

export const CircuitTrackingManagement = () => {
  const { circuitTrackings, isLoading, updateCircuitStage, addMilestone } = useCircuitTracking();
  const { toast } = useToast();
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'order' | 'stage' | 'customer'>('order');
  const [stageOrder, setStageOrder] = useState(STAGES);
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(stageOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setStageOrder(items);
  };

  const formatLocation = (address: any) => {
    if (!address) return '-';
    const parts = [];
    if (address.street_address) parts.push(address.street_address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
  };

  const groupedTrackings = circuitTrackings.reduce((acc, tracking) => {
    let groupKey: string;
    
    switch (groupBy) {
      case 'stage':
        groupKey = tracking.stage || 'Ready to Order';
        break;
      case 'customer':
        groupKey = tracking.quote_item?.quote?.client_info?.company_name || 
                  tracking.quote_item?.quote?.accepted_by || 
                  'Unknown Customer';
        break;
      case 'order':
      default:
        groupKey = tracking.order_id;
        break;
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(tracking);
    return acc;
  }, {} as Record<string, typeof circuitTrackings>);

  const sortedGroupEntries = groupBy === 'stage' 
    ? stageOrder.map(stage => [stage, groupedTrackings[stage]]).filter(([, trackings]) => trackings && trackings.length > 0)
    : Object.entries(groupedTrackings);

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
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Group by:</span>
            <Select value={groupBy} onValueChange={(value: 'order' | 'stage' | 'customer') => setGroupBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUPING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {circuitTrackings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders with quote items found. Order tracking is automatically created when quotes are approved.
            </div>
          ) : (
            <div className="space-y-6">
              {groupBy === 'stage' ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="stages">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                        {sortedGroupEntries.map(([groupKey, trackings], index) => (
                          <Draggable key={groupKey} draggableId={groupKey} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="border border-gray-200 rounded-lg"
                              >
                                <div 
                                  {...provided.dragHandleProps}
                                  className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                  <h3 className="font-semibold">
                                    Stage: {groupKey} ({trackings.length} item{trackings.length > 1 ? 's' : ''})
                                  </h3>
                                </div>
                                
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[200px]">Item Name</TableHead>
                                      <TableHead className="w-[250px]">Location</TableHead>
                                      <TableHead className="w-[150px]">Order</TableHead>
                                      <TableHead className="w-[150px]">Progress</TableHead>
                                      <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {trackings.map((circuit) => {
                                      const progress = getProgressFromStage(circuit.stage || 'Ready to Order');
                                      const progressBarClass = getProgressBarClassName(circuit.stage || 'Ready to Order');
                                      return (
                                        <TableRow key={circuit.id}>
                                          <TableCell className="font-medium">
                                            {circuit.item_name || circuit.quote_item?.item?.name || circuit.circuit_type}
                                          </TableCell>
                                          <TableCell className="text-sm text-gray-600">
                                            {formatLocation(circuit.quote_item?.address)}
                                          </TableCell>
                                          <TableCell className="text-sm text-gray-600">
                                            {circuit.order?.order_number || circuit.order_id.slice(0, 8)}
                                          </TableCell>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <Progress value={progress} className={progressBarClass} />
                                              <span className="text-xs text-gray-500">{progress}%</span>
                                            </div>
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                Object.entries(groupedTrackings).map(([groupKey, trackings]) => {
                  const getGroupHeader = () => {
                    if (groupBy === 'customer') {
                      return `Customer: ${groupKey} (${trackings.length} item${trackings.length > 1 ? 's' : ''})`;
                    } else {
                      const firstTracking = trackings[0];
                      const customerName = firstTracking?.quote_item?.quote?.client_info?.company_name || 
                                         firstTracking?.quote_item?.quote?.accepted_by || 
                                         'Unknown Customer';
                      const quoteNumber = firstTracking?.quote_item?.quote?.quote_number || 
                                        `Q-${firstTracking?.quote_item?.quote?.id?.slice(0, 8) || 'Unknown'}`;
                      return `Order: ${trackings[0]?.order?.order_number || groupKey.slice(0, 8)} | Customer: ${customerName} | Quote: ${quoteNumber}`;
                    }
                  };
                  
                  return (
                    <div key={groupKey} className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h3 className="font-semibold">
                          {getGroupHeader()}
                        </h3>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Item Name</TableHead>
                            <TableHead className="w-[250px]">Location</TableHead>
                            {groupBy === 'order' && <TableHead className="w-[80px]">Qty</TableHead>}
                            {groupBy === 'order' && <TableHead className="w-[100px]">Unit Price</TableHead>}
                            {groupBy === 'customer' && <TableHead className="w-[150px]">Order</TableHead>}
                            <TableHead className="w-[150px]">Progress</TableHead>
                            <TableHead className="w-[150px]">Stage</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trackings.map((circuit) => {
                            const progress = getProgressFromStage(circuit.stage || 'Ready to Order');
                            const progressBarClass = getProgressBarClassName(circuit.stage || 'Ready to Order');
                            return (
                              <TableRow key={circuit.id}>
                                <TableCell className="font-medium">
                                  {circuit.item_name || circuit.quote_item?.item?.name || circuit.circuit_type}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {formatLocation(circuit.quote_item?.address)}
                                </TableCell>
                                {groupBy === 'order' && (
                                  <TableCell>
                                    {circuit.quote_item?.quantity || '-'}
                                  </TableCell>
                                )}
                                {groupBy === 'order' && (
                                  <TableCell>
                                    ${circuit.quote_item?.unit_price || '0'}
                                  </TableCell>
                                )}
                                {groupBy === 'customer' && (
                                  <TableCell className="text-sm text-gray-600">
                                    {circuit.order?.order_number || circuit.order_id.slice(0, 8)}
                                  </TableCell>
                                )}
                                <TableCell>
                                  <div className="space-y-1">
                                    <Progress value={progress} className={progressBarClass} />
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
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
