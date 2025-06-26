
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import type { CarrierQuote } from "@/hooks/useCircuitQuotes";
import { CarrierCard } from "./CarrierCard";
import { useAuth } from "@/context/AuthContext";

interface CollapsibleCarrierGroupProps {
  carrierName: string;
  carriers: CarrierQuote[];
  onEditCarrier?: (carrier: CarrierQuote) => void;
  onDeleteCarrier?: (carrierId: string) => void;
  onCopyCarrier?: (carrier: CarrierQuote) => void;
  onReorderCarriers?: (reorderedCarriers: CarrierQuote[]) => void;
  allCarriers: CarrierQuote[]; // All carriers to maintain global order
}

export const CollapsibleCarrierGroup = ({
  carrierName,
  carriers,
  onEditCarrier,
  onDeleteCarrier,
  onCopyCarrier,
  onReorderCarriers,
  allCarriers
}: CollapsibleCarrierGroupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin } = useAuth();

  // Sort carriers within this group by display_order, then by speed
  const sortedCarriers = [...carriers].sort((a, b) => {
    const orderA = (a as any).display_order ?? 999;
    const orderB = (b as any).display_order ?? 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.speed.localeCompare(b.speed);
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !isAdmin || !onReorderCarriers) {
      return;
    }

    const { source, destination } = result;
    
    if (source.index === destination.index) {
      return;
    }

    // Create new array with reordered items within this group
    const reorderedGroupCarriers = Array.from(sortedCarriers);
    const [removed] = reorderedGroupCarriers.splice(source.index, 1);
    reorderedGroupCarriers.splice(destination.index, 0, removed);

    // Update display_order for carriers in this group
    const carriersWithNewOrder = reorderedGroupCarriers.map((carrier, index) => ({
      ...carrier,
      display_order: index + 1
    }));

    // Merge with other carriers not in this group
    const otherCarriers = allCarriers.filter(c => c.carrier !== carrierName);
    const allReorderedCarriers = [...otherCarriers, ...carriersWithNewOrder];

    onReorderCarriers(allReorderedCarriers);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start p-2 h-auto font-medium text-left hover:bg-gray-50"
        >
          <div className="flex items-center gap-2 w-full">
            {/* Move chevron to the left */}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: carriers[0]?.color || '#3B82F6' }}
            />
            <span className="flex-1">{carrierName}</span>
            <span className="text-sm text-gray-500">({carriers.length})</span>
          </div>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-2 mt-2">
        {isAdmin ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`carrier-group-${carrierName}`}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
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
          <div className="space-y-2">
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
      </CollapsibleContent>
    </Collapsible>
  );
};
