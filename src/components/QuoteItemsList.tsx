
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { QuoteItemData } from "@/types/quoteItems";
import { ClientAddress } from "@/types/clientAddress";
import { QuoteItemRow } from "@/components/QuoteItemRow";

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
    return (
      <div className="text-center py-8 text-gray-500">
        No items added yet. Select an item from above to add it to your quote.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Quote Items</h3>
      <DragDropContext onDragEnd={onReorderItems}>
        <Droppable droppableId="quote-items">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <QuoteItemRow
                        quoteItem={item}
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
    </div>
  );
};
