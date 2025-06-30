import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CircuitQuoteCardHeader } from "./CircuitQuoteCardHeader";
import { CircuitQuoteCardActions } from "./CircuitQuoteCardActions";
import { CircuitQuoteCarriers } from "@/components/CircuitQuoteCarriers";
import type { CircuitQuote, CarrierQuote } from "@/hooks/useCircuitQuotes";

interface CircuitQuoteCardProps {
  quote: CircuitQuote & {
    client?: string;
    creationDate?: string;
  };
  onUpdate: (quote: any) => void;
  onAddCarrier?: (carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => void;
  onUpdateCarrier?: (carrier: CarrierQuote) => void;
  onDeleteCarrier?: (carrierId: string) => void;
  onDeleteQuote?: (quoteId: string) => void;
}

export const CircuitQuoteCard = ({ 
  quote, 
  onUpdate, 
  onAddCarrier, 
  onUpdateCarrier, 
  onDeleteCarrier,
  onDeleteQuote
}: CircuitQuoteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    const updatedQuote = {
      ...quote,
      status: newStatus as 'new_pricing' | 'researching' | 'completed' | 'sent_to_customer'
    };
    onUpdate(updatedQuote);
  };

  const handleDeleteQuote = () => {
    if (onDeleteQuote) {
      onDeleteQuote(quote.id);
    }
  };

  const handleUpdateQuote = (updatedQuote: CircuitQuote) => {
    onUpdate(updatedQuote);
  };

  const deleteCarrierQuote = (carrierId: string) => {
    if (onDeleteCarrier) {
      onDeleteCarrier(carrierId);
    } else {
      // Fallback for backward compatibility
      const updatedQuote = {
        ...quote,
        carriers: quote.carriers.filter(carrier => carrier.id !== carrierId)
      };
      onUpdate(updatedQuote);
    }
  };

  const handleUpdateCarrier = (carrier: CarrierQuote) => {
    if (onUpdateCarrier) {
      onUpdateCarrier(carrier);
    }
    // Keep the card expanded after updating a carrier
    setIsExpanded(true);
  };

  const handleReorderCarriers = (reorderedCarriers: CarrierQuote[]) => {
    const updatedQuote = {
      ...quote,
      carriers: reorderedCarriers
    };
    onUpdate(updatedQuote);
  };

  const handleExpandCarrier = (carrierName: string) => {
    setIsExpanded(true);
    // Optional: You could add logic here to auto-expand the specific carrier group
    // This would require passing the carrierName to CollapsibleCarrierGroup
  };

  const actions = CircuitQuoteCardActions({
    onAddCarrier,
    onUpdateCarrier: handleUpdateCarrier
  });

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <CircuitQuoteCardHeader
          quote={quote}
          isExpanded={isExpanded}
          onToggleExpanded={() => setIsExpanded(!isExpanded)}
          onStatusChange={handleStatusChange}
          onDeleteQuote={handleDeleteQuote}
          onUpdateQuote={handleUpdateQuote}
        />
      </CardHeader>

      {!isExpanded && (
        <CardContent className="pt-0">
          <CircuitQuoteCarriers 
            carriers={quote.carriers}
            isMinimized={true}
            staticIp={quote.static_ip}
            slash29={quote.slash_29}
            mikrotikRequired={quote.mikrotik_required}
            onExpandCarrier={handleExpandCarrier}
          />
        </CardContent>
      )}

      {isExpanded && (
        <CardContent className="pt-0">
          <CircuitQuoteCarriers 
            carriers={quote.carriers}
            onAddCarrier={() => {
              actions.setIsAddCarrierDialogOpen(true);
              setIsExpanded(true); // Ensure it stays expanded when adding
            }}
            onEditCarrier={actions.handleEditCarrier}
            onDeleteCarrier={deleteCarrierQuote}
            onCopyCarrier={actions.copyCarrierQuote}
            onReorderCarriers={handleReorderCarriers}
            staticIp={quote.static_ip}
            slash29={quote.slash_29}
            mikrotikRequired={quote.mikrotik_required}
          />
        </CardContent>
      )}

      {actions.dialogs}
    </Card>
  );
};
