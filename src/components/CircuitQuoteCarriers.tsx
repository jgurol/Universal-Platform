
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { CarrierCard } from "./CircuitQuoteCarriers/CarrierCard";
import { CarrierTags } from "./CircuitQuoteCarriers/CarrierTags";

interface CircuitQuoteCarriersProps {
  carriers: CarrierQuote[];
  isMinimized?: boolean;
  onAddCarrier?: () => void;
  onEditCarrier?: (carrier: CarrierQuote) => void;
  onDeleteCarrier?: (carrierId: string) => void;
  onCopyCarrier?: (carrier: CarrierQuote) => void;
  staticIp?: boolean;
  slash29?: boolean;
  mikrotikRequired?: boolean;
}

export const CircuitQuoteCarriers = ({ 
  carriers, 
  isMinimized = false, 
  onAddCarrier, 
  onEditCarrier, 
  onDeleteCarrier,
  onCopyCarrier,
  staticIp = false,
  slash29 = false,
  mikrotikRequired = false
}: CircuitQuoteCarriersProps) => {
  if (isMinimized) {
    return <CarrierTags carriers={carriers} />;
  }

  // Sort carriers by carrier name first, then by speed
  const sortedCarriers = [...carriers].sort((a, b) => {
    const carrierComparison = a.carrier.localeCompare(b.carrier);
    if (carrierComparison !== 0) {
      return carrierComparison;
    }
    return a.speed.localeCompare(b.speed);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">Carrier Quotes</h4>
        {onAddCarrier && (
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
      
      <div className="grid gap-3">
        {sortedCarriers.map((carrier) => (
          <CarrierCard
            key={carrier.id}
            carrier={carrier}
            onEdit={onEditCarrier}
            onDelete={onDeleteCarrier}
            onCopy={onCopyCarrier}
          />
        ))}
      </div>
    </div>
  );
};
