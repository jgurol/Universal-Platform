
import { QuoteItemData } from "@/types/quoteItems";
import { QuoteItemForm } from "@/components/QuoteItemForm";
import { QuoteItemsList } from "@/components/QuoteItemsList";
import { useQuoteItemActions } from "@/hooks/useQuoteItemActions";
import { DropResult } from 'react-beautiful-dnd';

interface QuoteItemsManagerProps {
  items: QuoteItemData[];
  onItemsChange: (items: QuoteItemData[]) => void;
  clientInfoId?: string;
  showHeaders?: boolean;
}

export const QuoteItemsManager = ({ items, onItemsChange, clientInfoId, showHeaders = false }: QuoteItemsManagerProps) => {
  const {
    selectedItemId,
    setSelectedItemId,
    availableItems,
    isLoading,
    isAddingCarrierItem,
    addCarrierItem,
    addRegularItem,
    addresses
  } = useQuoteItemActions(clientInfoId);

  // Debug logging for addresses and items
  console.log('[QuoteItemsManager] Current addresses:', addresses);
  console.log('[QuoteItemsManager] Current items with addresses:', items.map(item => ({
    id: item.id,
    name: item.name,
    address_id: item.address_id,
    address: item.address
  })));

  const addItem = async () => {
    if (!selectedItemId) return;
    
    // Handle carrier quote items
    if (selectedItemId.startsWith('carrier-')) {
      const carrierQuoteId = selectedItemId.replace('carrier-', '');
      await addCarrierItem(carrierQuoteId, items, onItemsChange);
      return;
    }
    
    // Handle regular items - use first available address or none
    addRegularItem(items, onItemsChange);
  };

  const updateItem = (itemId: string, field: keyof QuoteItemData, value: number | string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // If updating address_id, also update the address object
        if (field === 'address_id') {
          const selectedAddress = addresses.find(addr => addr.id === value);
          updatedItem.address = selectedAddress;
          console.log('[QuoteItemsManager] Updated item address:', { 
            itemId, 
            addressId: value, 
            address: selectedAddress,
            itemName: updatedItem.name 
          });
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
        isLoading={isLoading || isAddingCarrierItem}
        onAddItem={addItem}
        disabled={!selectedItemId || !clientInfoId || isAddingCarrierItem}
        clientInfoId={clientInfoId}
      />

      <QuoteItemsList
        items={items}
        addresses={addresses}
        onUpdateItem={updateItem}
        onRemoveItem={removeItem}
        onReorderItems={handleDragEnd}
        showHeaders={showHeaders}
      />
    </div>
  );
};
