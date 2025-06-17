
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { QuoteItemData } from "@/types/quoteItems";
import { useItems } from "@/hooks/useItems";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { useCarrierQuoteItems } from "@/hooks/useCarrierQuoteItems";
import { QuoteItemForm } from "@/components/QuoteItemForm";
import { QuoteItemRow } from "@/components/QuoteItemRow";
import { QuoteItemTotals } from "@/components/QuoteItemTotals";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface QuoteItemsManagerProps {
  items: QuoteItemData[];
  onItemsChange: (items: QuoteItemData[]) => void;
  clientInfoId?: string;
}

export const QuoteItemsManager = ({ items, onItemsChange, clientInfoId }: QuoteItemsManagerProps) => {
  const { items: availableItems, isLoading } = useItems();
  const { addresses } = useClientAddresses(clientInfoId || null);
  const { carrierQuoteItems } = useCarrierQuoteItems(clientInfoId || null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const { user } = useAuth();

  const addItem = async () => {
    if (!selectedItemId) return;
    
    // Handle carrier quote items
    if (selectedItemId.startsWith('carrier-')) {
      const carrierQuoteId = selectedItemId.replace('carrier-', '');
      const carrierItem = carrierQuoteItems.find(item => item.id === carrierQuoteId);
      
      if (carrierItem && user) {
        // Find matching address based on circuit quote location
        let matchingAddress = addresses.find(addr => 
          addr.city.toLowerCase().includes(carrierItem.location.toLowerCase()) ||
          addr.street_address.toLowerCase().includes(carrierItem.location.toLowerCase())
        );
        
        // If no matching address found, use the first available address
        if (!matchingAddress && addresses.length > 0) {
          matchingAddress = addresses[0];
        }

        try {
          // Create an item in the items table for this carrier quote
          const { data: newItem, error: itemError } = await supabase
            .from('items')
            .insert({
              user_id: user.id,
              name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
              description: `Location: ${carrierItem.location}${carrierItem.term ? ` | Term: ${carrierItem.term}` : ''}${carrierItem.notes ? ` | Notes: ${carrierItem.notes}` : ''}`,
              price: 0, // Leave sell price blank
              cost: carrierItem.price, // Populate cost with carrier price
              charge_type: 'MRC',
              is_active: true
            })
            .select()
            .single();

          if (itemError) {
            console.error('Error creating item for carrier quote:', itemError);
            return;
          }

          const quoteItem: QuoteItemData = {
            id: `temp-${Date.now()}`,
            item_id: newItem.id,
            quantity: 1,
            unit_price: 0, // Leave sell price blank
            cost_override: carrierItem.price, // Populate cost with carrier price
            total_price: 0, // Will be 0 since unit_price is 0
            charge_type: 'MRC',
            address_id: matchingAddress?.id,
            name: newItem.name,
            description: newItem.description || '',
            item: newItem,
            address: matchingAddress
          };

          // Just add to the items list, don't trigger any save
          onItemsChange([...items, quoteItem]);
          setSelectedItemId("");
          return;
        } catch (error) {
          console.error('Error creating carrier quote item:', error);
          return;
        }
      }
    }
    
    // Handle regular items
    const selectedItem = availableItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;

    const newItem: QuoteItemData = {
      id: `temp-${Date.now()}`,
      item_id: selectedItemId,
      quantity: 1,
      unit_price: selectedItem.price,
      cost_override: selectedItem.cost,
      total_price: selectedItem.price,
      charge_type: (selectedItem.charge_type as 'NRC' | 'MRC') || 'NRC',
      address_id: addresses.length > 0 ? addresses[0].id : undefined,
      name: selectedItem.name,
      description: selectedItem.description || '',
      item: selectedItem,
      address: addresses.length > 0 ? addresses[0] : undefined
    };

    // Just add to the items list, don't trigger any save
    onItemsChange([...items, newItem]);
    setSelectedItemId("");
  };

  const updateItem = (itemId: string, field: keyof QuoteItemData, value: number | string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // If updating address_id, also update the address object
        if (field === 'address_id') {
          const selectedAddress = addresses.find(addr => addr.id === value);
          updatedItem.address = selectedAddress;
        }
        
        // Recalculate total price when quantity or unit price changes
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const removeItem = (itemId: string) => {
    onItemsChange(items.filter(item => item.id !== itemId));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    onItemsChange(newItems);
  };

  return (
    <div className="space-y-4">
      <QuoteItemForm
        selectedItemId={selectedItemId}
        onSelectedItemIdChange={setSelectedItemId}
        availableItems={availableItems}
        isLoading={isLoading}
        onAddItem={addItem}
        disabled={!selectedItemId || !clientInfoId}
        clientInfoId={clientInfoId}
      />

      {items.length > 0 && (
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
          
          <DragDropContext onDragEnd={handleDragEnd}>
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
                            onUpdateItem={updateItem}
                            onRemoveItem={removeItem}
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
      )}
    </div>
  );
};
