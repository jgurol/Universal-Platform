
import { QuoteItemData } from "@/types/quoteItems";
import { ClientAddress } from "@/types/clientAddress";
import { Label } from "@/components/ui/label";
import { QuoteItemRow } from "@/components/QuoteItemRow";
import { QuoteItemTotals } from "@/components/QuoteItemTotals";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface QuoteItemsListProps {
  items: QuoteItemData[];
  addresses: ClientAddress[];
  onUpdateItem: (itemId: string, field: keyof QuoteItemData, value: number | string) => void;
  onRemoveItem: (itemId: string) => void;
  onReorderItems: (result: DropResult) => void;
}

export const QuoteItemsList = ({ 
  items, 
  addresses, 
  onUpdateItem, 
  onRemoveItem, 
  onReorderItems 
}: QuoteItemsListProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Label>Quote Items</Label>
      
      {/* Column Headers */}
      <div className="grid grid-cols-6 gap-2 items-center p-2 border-b bg-gray-100 rounded-t-lg font-medium text-sm">
        <div className="col-span-2">Item & Location</div>
        <div>Qty</div>
        <div>Sell / Cost</div>
        <div>Total</div>
        <div>Type</div>
      </div>
      
      <DragDropContext onDragEnd={onReorderItems}>
        <Droppable droppableId="quote-items">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="border rounded-lg space-y-3 max-h-96 overflow-y-auto"
            >
              {items.map((quoteItem, index) => (
                <Draggable
                  key={quoteItem.id}
                  draggableId={quoteItem.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    >
                      <QuoteItemRow
                        quoteItem={quoteItem}
                        addresses={addresses}
                        onUpdateItem={onUpdateItem}
                        onRemoveItem={onRemoveItem}
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
      
      <QuoteItemTotals items={items} />
    </div>
  );
};
