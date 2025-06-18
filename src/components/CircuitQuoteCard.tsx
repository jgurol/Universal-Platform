
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { AddCarrierQuoteDialog } from "@/components/AddCarrierQuoteDialog";
import { EditCarrierQuoteDialog } from "@/components/EditCarrierQuoteDialog";
import { CircuitQuoteHeader } from "@/components/CircuitQuoteHeader";
import { CircuitQuoteCarriers } from "@/components/CircuitQuoteCarriers";
import { CircuitQuoteStatusSelect } from "@/components/CircuitQuoteStatusSelect";
import type { CircuitQuote, CarrierQuote } from "@/hooks/useCircuitQuotes";
import { useToast } from "@/hooks/use-toast";

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
  const [isAddCarrierDialogOpen, setIsAddCarrierDialogOpen] = useState(false);
  const [isEditCarrierDialogOpen, setIsEditCarrierDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<CarrierQuote | null>(null);
  const { toast } = useToast();

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

  const addCarrierQuote = (carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => {
    if (onAddCarrier) {
      onAddCarrier(carrierQuote);
    } else {
      // Fallback for backward compatibility
      const newCarrierQuote: CarrierQuote = {
        ...carrierQuote,
        id: Date.now().toString(),
        circuit_quote_id: quote.id
      };
      
      const updatedQuote = {
        ...quote,
        carriers: [...quote.carriers, newCarrierQuote]
      };
      
      onUpdate(updatedQuote);
    }
  };

  const editCarrierQuote = (updatedCarrier: CarrierQuote) => {
    if (onUpdateCarrier) {
      onUpdateCarrier(updatedCarrier);
    } else {
      // Fallback for backward compatibility
      const updatedQuote = {
        ...quote,
        carriers: quote.carriers.map(carrier => 
          carrier.id === updatedCarrier.id ? updatedCarrier : carrier
        )
      };
      
      onUpdate(updatedQuote);
    }
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

  const copyCarrierQuote = (carrier: CarrierQuote) => {
    const carrierCopy = {
      carrier: carrier.carrier,
      type: carrier.type,
      speed: carrier.speed,
      price: 0, // Reset price for copied quote
      term: carrier.term,
      notes: `Copied from ${carrier.carrier} quote`,
      color: carrier.color
    };

    if (onAddCarrier) {
      onAddCarrier(carrierCopy);
      toast({
        title: "Carrier Quote Copied",
        description: `${carrier.carrier} quote has been copied successfully`,
      });
    }
  };

  const handleEditCarrier = (carrier: CarrierQuote) => {
    setEditingCarrier(carrier);
    setIsEditCarrierDialogOpen(true);
  };

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-8 w-8"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <CircuitQuoteHeader quote={quote} />
          </div>
          <div className="flex items-center gap-3">
            <CircuitQuoteHeader quote={quote} showPriceDisplay />
            <div className="flex items-center gap-2">
              <CircuitQuoteStatusSelect 
                status={quote.status} 
                onStatusChange={handleStatusChange} 
              />
              {onDeleteQuote && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteQuote}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  title="Delete Quote"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Show vendor badges when minimized */}
        {!isExpanded && quote.carriers.length > 0 && (
          <CircuitQuoteCarriers 
            carriers={quote.carriers} 
            isMinimized 
          />
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <CircuitQuoteCarriers 
            carriers={quote.carriers}
            onAddCarrier={() => setIsAddCarrierDialogOpen(true)}
            onEditCarrier={handleEditCarrier}
            onDeleteCarrier={deleteCarrierQuote}
            onCopyCarrier={copyCarrierQuote}
          />
        </CardContent>
      )}

      <AddCarrierQuoteDialog
        open={isAddCarrierDialogOpen}
        onOpenChange={setIsAddCarrierDialogOpen}
        onAddCarrier={addCarrierQuote}
      />

      {editingCarrier && (
        <EditCarrierQuoteDialog
          open={isEditCarrierDialogOpen}
          onOpenChange={setIsEditCarrierDialogOpen}
          carrier={editingCarrier}
          onUpdateCarrier={editCarrierQuote}
        />
      )}
    </Card>
  );
};
