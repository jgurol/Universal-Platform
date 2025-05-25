
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { QuoteItemData } from "@/types/quoteItems";
import { useItems } from "@/hooks/useItems";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { QuoteItemForm } from "@/components/QuoteItemForm";
import { QuoteItemRow } from "@/components/QuoteItemRow";
import { QuoteItemTotals } from "@/components/QuoteItemTotals";

interface QuoteItemsManagerProps {
  items: QuoteItemData[];
  onItemsChange: (items: QuoteItemData[]) => void;
  clientInfoId?: string;
}

export const QuoteItemsManager = ({ items, onItemsChange, clientInfoId }: QuoteItemsManagerProps) => {
  const { items: availableItems, isLoading } = useItems();
  const { addresses } = useClientAddresses(clientInfoId || null);
  const [selectedItemId, setSelectedItemId] = useState("");

  const addItem = () => {
    if (!selectedItemId) return;
    
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
      description: selectedItem.description || '', // Initialize with item description
      item: selectedItem,
      address: addresses.length > 0 ? addresses[0] : undefined
    };

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

  return (
    <div className="space-y-4">
      <QuoteItemForm
        selectedItemId={selectedItemId}
        onSelectedItemIdChange={setSelectedItemId}
        availableItems={availableItems}
        isLoading={isLoading}
        onAddItem={addItem}
        disabled={!selectedItemId || !clientInfoId}
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
          
          <div className="border rounded-lg space-y-3 max-h-60 overflow-y-auto">
            {items.map((quoteItem) => (
              <QuoteItemRow
                key={quoteItem.id}
                quoteItem={quoteItem}
                addresses={addresses}
                onUpdateItem={updateItem}
                onRemoveItem={removeItem}
              />
            ))}
          </div>
          
          <QuoteItemTotals items={items} />
        </div>
      )}
    </div>
  );
};
