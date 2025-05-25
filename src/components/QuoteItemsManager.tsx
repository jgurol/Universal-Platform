
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { Item } from "@/types/items";
import { useItems } from "@/hooks/useItems";

interface QuoteItemData {
  id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  cost_override?: number;
  total_price: number;
  charge_type: 'NRC' | 'MRC';
  item?: Item;
}

interface QuoteItemsManagerProps {
  items: QuoteItemData[];
  onItemsChange: (items: QuoteItemData[]) => void;
}

export const QuoteItemsManager = ({ items, onItemsChange }: QuoteItemsManagerProps) => {
  const { items: availableItems, isLoading } = useItems();
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
      item: selectedItem
    };

    onItemsChange([...items, newItem]);
    setSelectedItemId("");
  };

  const updateItem = (itemId: string, field: keyof QuoteItemData, value: number | string) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
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
          disabled={!selectedItemId}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <Label>Quote Items</Label>
          
          {/* Column Headers */}
          <div className="grid grid-cols-7 gap-2 items-center p-2 border-b bg-gray-100 rounded-t-lg font-medium text-sm">
            <div>Item</div>
            <div>Qty</div>
            <div>Sell Price</div>
            <div>Cost</div>
            <div>Total</div>
            <div>Type</div>
            <div>Action</div>
          </div>
          
          <div className="border rounded-lg space-y-3 max-h-60 overflow-y-auto">
            {items.map((quoteItem) => (
              <div key={quoteItem.id} className="grid grid-cols-7 gap-2 items-center p-2 border rounded bg-gray-50">
                <div className="text-sm font-medium">
                  {quoteItem.item?.name || 'Unknown Item'}
                </div>
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
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteItem.unit_price}
                    onChange={(e) => updateItem(quoteItem.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="text-xs h-8"
                    placeholder="Sell $"
                  />
                </div>
                <div>
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
                <div className="text-sm font-medium">
                  ${quoteItem.total_price.toFixed(2)}
                </div>
                <div className="flex items-center space-x-2">
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
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
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
