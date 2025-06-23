
import { CarrierCard } from "./CircuitQuoteCarriers/CarrierCard";
import { CarrierTags } from "./CircuitQuoteCarriers/CarrierTags";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";

interface CircuitQuoteCarriersProps {
  carriers: CarrierQuote[];
  onAddCarrier?: () => void;
  onEditCarrier?: (carrier: CarrierQuote) => void;
  onDeleteCarrier?: (carrierId: string) => void;
  onCopyCarrier?: (carrier: CarrierQuote) => void;
  isMinimized?: boolean;
  staticIp?: boolean;
  slash29?: boolean;
  mikrotikRequired?: boolean;
}

export const CircuitQuoteCarriers = ({ 
  carriers,
  onAddCarrier,
  onEditCarrier,
  onDeleteCarrier,
  onCopyCarrier,
  isMinimized = false,
  staticIp,
  slash29,
  mikrotikRequired
}: CircuitQuoteCarriersProps) => {
  if (isMinimized) {
    return (
      <div className="space-y-4">
        <CarrierTags 
          carriers={carriers}
          staticIp={staticIp}
          slash29={slash29}
          mikrotikRequired={mikrotikRequired}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CarrierTags 
        carriers={carriers}
        staticIp={staticIp}
        slash29={slash29}
        mikrotikRequired={mikrotikRequired}
      />
      
      <div className="space-y-2">
        {carriers.length > 0 && (
          <CarrierCard
            key={carriers[0].id}
            carrier={carriers[0]}
            onEdit={onEditCarrier}
            onDelete={onDeleteCarrier}
            onCopy={onCopyCarrier}
            showHeader={true}
          />
        )}
        {carriers.slice(1).map((carrier) => (
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
