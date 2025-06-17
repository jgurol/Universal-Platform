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

interface QuoteItemsManagerProps {
  items: QuoteItemData[];
  onItemsChange: (items: QuoteItemData[]) => void;
  clientInfoId?: string;
}

// Helper function to parse location string into address components
const parseLocationToAddress = (location: string) => {
  // Basic parsing logic for common address formats
  const parts = location.split(',').map(part => part.trim());
  
  if (parts.length >= 3) {
    // Format: "123 Main St, City, State ZIP" or similar
    const streetAddress = parts[0];
    const city = parts[1];
    const stateZip = parts[2];
    
    // Try to extract state and zip from the last part
    const stateZipMatch = stateZip.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
    if (stateZipMatch) {
      return {
        street_address: streetAddress,
        city: city,
        state: stateZipMatch[1],
        zip_code: stateZipMatch[2]
      };
    } else {
      return {
        street_address: streetAddress,
        city: city,
        state: stateZip,
        zip_code: '00000'
      };
    }
  } else if (parts.length === 2) {
    // Format: "City, State" or "Address, City"
    return {
      street_address: parts[0],
      city: parts[1],
      state: 'Unknown',
      zip_code: '00000'
    };
  } else {
    // Single part - treat as city
    return {
      street_address: '',
      city: location,
      state: 'Unknown',
      zip_code: '00000'
    };
  }
};

export const QuoteItemsManager = ({ items, onItemsChange, clientInfoId }: QuoteItemsManagerProps) => {
  const { items: availableItems, isLoading } = useItems();
  const { addresses, addAddress } = useClientAddresses(clientInfoId || null);
  const { carrierQuoteItems } = useCarrierQuoteItems(clientInfoId || null);
  const [selectedItemId, setSelectedItemId] = useState("");

  const addItem = async () => {
    if (!selectedItemId) return;
    
    // Handle carrier quote items
    if (selectedItemId.startsWith('carrier-')) {
      const carrierQuoteId = selectedItemId.replace('carrier-', '');
      const carrierItem = carrierQuoteItems.find(item => item.id === carrierQuoteId);
      
      if (carrierItem && clientInfoId) {
        // Parse the location into address components
        const parsedAddress = parseLocationToAddress(carrierItem.location);
        
        // Check if a similar address already exists
        const addressExists = addresses.some(addr => 
          addr.city.toLowerCase() === parsedAddress.city.toLowerCase() &&
          addr.state.toLowerCase() === parsedAddress.state.toLowerCase()
        );

        let matchingAddress = addresses.find(addr => 
          addr.city.toLowerCase() === parsedAddress.city.toLowerCase() &&
          addr.state.toLowerCase() === parsedAddress.state.toLowerCase()
        );

        // If address doesn't exist, create a new one with parsed components
        if (!addressExists && carrierItem.location.trim()) {
          try {
            const newAddressData = {
              client_info_id: clientInfoId,
              address_type: 'service',
              street_address: parsedAddress.street_address || carrierItem.location,
              city: parsedAddress.city,
              state: parsedAddress.state,
              zip_code: parsedAddress.zip_code,
              country: 'United States',
              is_primary: addresses.length === 0 // Make it primary if it's the first address
            };

            console.log('[QuoteItemsManager] Creating new address with parsed components:', newAddressData);
            const newAddress = await addAddress(newAddressData);
            matchingAddress = newAddress;
            console.log('[QuoteItemsManager] Address created successfully:', newAddress);
          } catch (error) {
            console.error('Error creating address for carrier location:', error);
            // Continue without address if creation fails
          }
        }

        // If still no matching address, use the first available address
        if (!matchingAddress && addresses.length > 0) {
          matchingAddress = addresses[0];
        }

        // Create a temporary quote item for the carrier quote (no database item needed)
        const quoteItem: QuoteItemData = {
          id: `temp-carrier-${Date.now()}`,
          item_id: `carrier-${carrierItem.id}`, // Use a special ID format for carrier items
          quantity: 1,
          unit_price: 0, // Leave sell price blank
          cost_override: carrierItem.price, // Populate cost with carrier price
          total_price: 0, // Will be 0 since unit_price is 0
          charge_type: 'MRC',
          address_id: matchingAddress?.id,
          name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
          description: `Location: ${carrierItem.location}${carrierItem.term ? ` | Term: ${carrierItem.term}` : ''}${carrierItem.notes ? ` | Notes: ${carrierItem.notes}` : ''}`,
          item: {
            id: `carrier-${carrierItem.id}`,
            user_id: '',
            name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
            description: `Location: ${carrierItem.location}${carrierItem.term ? ` | Term: ${carrierItem.term}` : ''}${carrierItem.notes ? ` | Notes: ${carrierItem.notes}` : ''}`,
            price: 0,
            cost: carrierItem.price,
            charge_type: 'MRC',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          address: matchingAddress
        };

        // Just add to the items list, don't trigger any save
        onItemsChange([...items, quoteItem]);
        setSelectedItemId("");
        return;
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
