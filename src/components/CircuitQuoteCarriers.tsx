
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { CarrierTags } from "./CircuitQuoteCarriers/CarrierTags";
import { CollapsibleCarrierGroup } from "./CircuitQuoteCarriers/CollapsibleCarrierGroup";
import { useAuth } from "@/context/AuthContext";
import { reorderCarrierQuotes } from "@/services/circuitQuotes/reorderCarrierQuotes";
import { useToast } from "@/hooks/use-toast";

interface CircuitQuoteCarriersProps {
  carriers: CarrierQuote[];
  isMinimized?: boolean;
  onAddCarrier?: () => void;
  onEditCarrier?: (carrier: CarrierQuote) => void;
  onDeleteCarrier?: (carrierId: string) => void;
  onCopyCarrier?: (carrier: CarrierQuote) => void;
  onReorderCarriers?: (reorderedCarriers: CarrierQuote[]) => void;
  staticIp?: boolean;
  slash29?: boolean;
  mikrotikRequired?: boolean;
  onExpandCarrier?: (carrierName: string) => void;
  expandedCarrier?: string; // New prop to track which carrier should be expanded
}

export const CircuitQuoteCarriers = ({ 
  carriers, 
  isMinimized = false, 
  onAddCarrier, 
  onEditCarrier, 
  onDeleteCarrier,
  onCopyCarrier,
  onReorderCarriers,
  staticIp = false,
  slash29 = false,
  mikrotikRequired = false,
  onExpandCarrier,
  expandedCarrier
}: CircuitQuoteCarriersProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const handleCarrierClick = (carrierName: string) => {
    if (onExpandCarrier) {
      onExpandCarrier(carrierName);
    }
  };

  if (isMinimized) {
    return <CarrierTags carriers={carriers} onCarrierClick={handleCarrierClick} />;
  }

  // Group carriers by carrier name
  const carrierGroups = carriers.reduce((groups, carrier) => {
    const carrierName = carrier.carrier;
    if (!groups[carrierName]) {
      groups[carrierName] = [];
    }
    groups[carrierName].push(carrier);
    return groups;
  }, {} as Record<string, CarrierQuote[]>);

  // If expandedCarrier is set, only show that specific carrier group
  const carriersToShow = expandedCarrier 
    ? { [expandedCarrier]: carrierGroups[expandedCarrier] }
    : carrierGroups;

  // Sort carrier groups by the first carrier's display_order in each group
  const sortedCarrierNames = Object.keys(carriersToShow).sort((a, b) => {
    const firstCarrierA = carriersToShow[a][0];
    const firstCarrierB = carriersToShow[b][0];
    
    const orderA = (firstCarrierA as any).display_order ?? 999;
    const orderB = (firstCarrierB as any).display_order ?? 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.localeCompare(b);
  });

  const handleReorderCarriers = async (reorderedCarriers: CarrierQuote[]) => {
    if (!onReorderCarriers) return;

    // Update display_order for all carriers
    const carriersWithNewOrder = reorderedCarriers.map((carrier, index) => ({
      ...carrier,
      display_order: index + 1
    }));

    // Optimistic update
    onReorderCarriers(carriersWithNewOrder);

    // Save to database
    const updateData = carriersWithNewOrder.map(carrier => ({
      id: carrier.id,
      display_order: (carrier as any).display_order
    }));

    const success = await reorderCarrierQuotes(updateData);
    
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to save new order. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">Carrier Quotes</h4>
        {isAdmin && onAddCarrier && (
          <Button
            size="sm"
            onClick={onAddCarrier}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Carrier
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {sortedCarrierNames.map((carrierName) => (
          <CollapsibleCarrierGroup
            key={carrierName}
            carrierName={carrierName}
            carriers={carriersToShow[carrierName]}
            allCarriers={carriers}
            onEditCarrier={onEditCarrier}
            onDeleteCarrier={onDeleteCarrier}
            onCopyCarrier={onCopyCarrier}
            onReorderCarriers={handleReorderCarriers}
            shouldExpand={expandedCarrier === carrierName}
          />
        ))}
      </div>
    </div>
  );
};
