
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

type QuoteItemData = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  vendor?: string;
};

interface QuoteItemsTabProps {
  items: QuoteItemData[];
  onItemsChange: (items: QuoteItemData[]) => void;
  clientInfoId?: string;
}

export const QuoteItemsTab = ({ items, onItemsChange, clientInfoId }: QuoteItemsTabProps) => {
  const addItem = () => {
    const newItem: QuoteItemData = {
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      category: "",
      vendor: ""
    };
    onItemsChange([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof QuoteItemData, value: string | number) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate total_price when quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        }
        
        return updatedItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.total_price, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Quote Items</h3>
        <Button type="button" onClick={addItem} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No items added yet. Click "Add Item" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Item {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={item.category || ""}
                    onChange={(e) => updateItem(index, 'category', e.target.value)}
                    placeholder="Item category"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Input
                    value={item.vendor || ""}
                    onChange={(e) => updateItem(index, 'vendor', e.target.value)}
                    placeholder="Vendor name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.total_price.toFixed(2)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="text-right">
                <Label className="text-lg font-semibold">
                  Total: ${calculateTotal().toFixed(2)}
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
