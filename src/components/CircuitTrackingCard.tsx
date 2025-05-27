
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCircuitTracking } from "@/hooks/useCircuitTracking";
import { Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export const CircuitTrackingCard = () => {
  const { circuitTrackings, isLoading } = useCircuitTracking();
  const navigate = useNavigate();

  const activeCircuits = circuitTrackings.filter(circuit => 
    circuit.stage !== 'Billed' && circuit.stage !== 'Ready for Billing'
  );

  const recentCircuits = activeCircuits.slice(0, 5);

  const formatLocation = (address: any) => {
    if (!address) return '-';
    const parts = [];
    if (address.street_address) parts.push(address.street_address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Circuit Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Circuit Tracking
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/quoting-system')}
            className="flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          {activeCircuits.length} active circuits in progress
        </div>
      </CardHeader>
      <CardContent>
        {recentCircuits.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No active circuits found
          </div>
        ) : (
          <div className="space-y-4">
            {recentCircuits.map((circuit) => {
              const progress = getProgressFromStage(circuit.stage || 'Ready to Order');
              const progressBarClass = getProgressBarClassName(circuit.stage || 'Ready to Order');
              const customerName = circuit.quote_item?.quote?.client_info?.company_name || 
                                 circuit.quote_item?.quote?.accepted_by || 
                                 'Unknown Customer';
              const orderNumber = circuit.order?.order_number || circuit.order_id.slice(0, 8);
              
              return (
                <div key={circuit.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {circuit.item_name || circuit.quote_item?.item?.name || circuit.circuit_type}
                      </h4>
                      <p className="text-xs text-gray-600 truncate">
                        {customerName} • Order: {orderNumber}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {formatLocation(circuit.quote_item?.address)}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs font-medium text-gray-700">
                        {circuit.stage || 'Ready to Order'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {progress}%
                      </div>
                    </div>
                  </div>
                  <Progress value={progress} className={progressBarClass} />
                </div>
              );
            })}
            
            {activeCircuits.length > 5 && (
              <div className="text-center pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/quoting-system')}
                  className="text-xs"
                >
                  View {activeCircuits.length - 5} more circuits
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
