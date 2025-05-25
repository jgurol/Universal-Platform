
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, MapPin } from "lucide-react";
import { Item } from "@/types/items";
import { useItems } from "@/hooks/useItems";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { QuoteItemData } from "@/types/quoteItems";

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

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.total_price, 0);
  };

  const formatAddressShort = (address: any) => {
    if (!address) return 'No address';
    return `${address.address_type} - ${address.city}, ${address.state}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="item-select">Add Item</Label>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an item to add" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              {isLoading ? (
                <SelectItem value="loading" disabled>Loading items...</SelectItem>
              ) : availableItems.length === 0 ? (
                <SelectItem value="no-items" disabled>No items available</SelectItem>
              ) : (
                availableItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} - ${item.price.toFixed(2)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Button 
          type="button" 
          onClick={addItem} 
          disabled={!selectedItemId || !clientInfoId}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {!clientInfoId && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          Please select a client first to add items with locations.
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <Label>Quote Items</Label>
          
          {/* Column Headers */}
          <div className="grid grid-cols-5 gap-2 items-center p-2 border-b bg-gray-100 rounded-t-lg font-medium text-sm">
            <div className="col-span-2">Item & Location</div>
            <div>Qty</div>
            <div>Sell / Cost</div>
            <div>Total & Type</div>
          </div>
          
          <div className="border rounded-lg space-y-3 max-h-60 overflow-y-auto">
            {items.map((quoteItem) => (
              <div key={quoteItem.id} className="grid grid-cols-5 gap-2 items-start p-3 border rounded bg-gray-50">
                {/* Item & Location Column */}
                <div className="col-span-2 space-y-2">
                  <div className="text-sm font-medium">
                    {quoteItem.item?.name || 'Unknown Item'}
                  </div>
                  {quoteItem.item?.description && (
                    <div className="text-xs text-gray-600">
                      {quoteItem.item.description}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <Select 
                      value={quoteItem.address_id || ""} 
                      onValueChange={(value) => updateItem(quoteItem.id, 'address_id', value)}
                    >
                      <SelectTrigger className="text-xs h-6 border-gray-300">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                        {addresses.length === 0 ? (
                          <SelectItem value="no-addresses" disabled>No addresses available</SelectItem>
                        ) : (
                          addresses.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              {formatAddressShort(address)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <Input
                    type="number"
                    min="1"
                    value={quoteItem.quantity}
                    onChange={(e) => updateItem(quoteItem.id, 'quantity', parseInt(e.target.value) || 1)}
                    className="text-xs h-8"
                    placeholder="Qty"
                  />
                </div>

                {/* Sell Price / Cost */}
                <div className="space-y-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteItem.unit_price}
                    onChange={(e) => updateItem(quoteItem.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="text-xs h-8"
                    placeholder="Sell $"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteItem.cost_override || 0}
                    onChange={(e) => updateItem(quoteItem.id, 'cost_override', parseFloat(e.target.value) || 0)}
                    className="text-xs h-8"
                    placeholder="Cost $"
                  />
                </div>

                {/* Total & Type */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    ${quoteItem.total_price.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Switch
                        checked={quoteItem.charge_type === 'MRC'}
                        onCheckedChange={(checked) => updateItem(quoteItem.id, 'charge_type', checked ? 'MRC' : 'NRC')}
                      />
                      <span className="text-xs font-medium">
                        {quoteItem.charge_type}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(quoteItem.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium">Total Amount:</span>
            <span className="font-bold text-lg">${getTotalAmount().toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
