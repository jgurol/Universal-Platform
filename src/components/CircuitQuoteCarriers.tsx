
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { CarrierCard } from "./CircuitQuoteCarriers/CarrierCard";
import { CarrierTags } from "./CircuitQuoteCarriers/CarrierTags";
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
  mikrotikRequired = false
}: CircuitQuoteCarriersProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  if (isMinimized) {
    return <CarrierTags carriers={carriers} />;
  }

  // Sort carriers by display_order first, then by carrier name, then by speed
  const sortedCarriers = [...carriers].sort((a, b) => {
    // Use display_order if available, otherwise fall back to creation order
    const orderA = (a as any).display_order ?? 999;
    const orderB = (b as any).display_order ?? 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    const carrierComparison = a.carrier.localeCompare(b.carrier);
    if (carrierComparison !== 0) {
      return carrierComparison;
    }
    return a.speed.localeCompare(b.speed);
  });

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !isAdmin || !onReorderCarriers) {
      return;
    }

    const { source, destination } = result;
    
    if (source.index === destination.index) {
      return;
    }

    // Create new array with reordered items
    const reorderedCarriers = Array.from(sortedCarriers);
    const [removed] = reorderedCarriers.splice(source.index, 1);
    reorderedCarriers.splice(destination.index, 0, removed);

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
      // Revert optimistic update by not calling onReorderCarriers again
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
      
      {isAdmin ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="carrier-quotes">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`grid gap-3 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
              >
                {sortedCarriers.map((carrier, index) => (
                  <Draggable key={carrier.id} draggableId={carrier.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        <CarrierCard
                          carrier={carrier}
                          onEdit={onEditCarrier}
                          onDelete={onDeleteCarrier}
                          onCopy={onCopyCarrier}
                          dragHandleProps={provided.dragHandleProps}
                        />
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
        <div className="grid gap-3">
          {sortedCarriers.map((carrier) => (
            <CarrierCard
              key={carrier.id}
              carrier={carrier}
              onEdit={isAdmin ? onEditCarrier : undefined}
              onDelete={isAdmin ? onDeleteCarrier : undefined}
              onCopy={isAdmin ? onCopyCarrier : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
