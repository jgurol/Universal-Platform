
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Item } from "@/types/items";

interface QuoteItemFormProps {
  selectedItemId: string;
  onSelectedItemIdChange: (value: string) => void;
  availableItems: Item[];
  isLoading: boolean;
  onAddItem: () => void;
  disabled: boolean;
}

export const QuoteItemForm = ({
  selectedItemId,
  onSelectedItemIdChange,
  availableItems,
  isLoading,
  onAddItem,
  disabled
}: QuoteItemFormProps) => {
  return (
    <>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="item-select">Add Item</Label>
          <Select value={selectedItemId} onValueChange={onSelectedItemIdChange}>
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
          onClick={onAddItem} 
          disabled={disabled}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {disabled && (
        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
          Please select a client first to add items with locations.
        </div>
      )}
    </>
  );
};
