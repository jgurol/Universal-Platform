
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { Item } from "@/types/items";
import { useCarrierQuoteItems } from "@/hooks/useCarrierQuoteItems";
import { Badge } from "@/components/ui/badge";

interface QuoteItemFormProps {
  selectedItemId: string;
  onSelectedItemIdChange: (value: string) => void;
  availableItems: Item[];
  isLoading: boolean;
  onAddItem: () => void;
  disabled: boolean;
  clientInfoId?: string;
}

export const QuoteItemForm = ({
  selectedItemId,
  onSelectedItemIdChange,
  availableItems,
  isLoading,
  onAddItem,
  disabled,
  clientInfoId
}: QuoteItemFormProps) => {
  const { carrierQuoteItems, loading: carrierLoading } = useCarrierQuoteItems(clientInfoId || null);

  const hasCarrierItems = carrierQuoteItems.length > 0;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="space-y-2">
        <Label>Add Item to Quote</Label>
        <div className="flex gap-2">
          <Select value={selectedItemId} onValueChange={onSelectedItemIdChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={isLoading || carrierLoading ? "Loading..." : "Select an item"} />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {/* Regular items */}
              {availableItems.length > 0 && (
                <>
                  <div className="px-2 py-1 text-sm font-semibold text-gray-600 bg-gray-100">
                    Catalog Items
                  </div>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-sm text-gray-500">${item.price}</span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              
              {/* Carrier quote items */}
              {hasCarrierItems && (
                <>
                  {availableItems.length > 0 && <div className="border-t my-1" />}
                  <div className="px-2 py-1 text-sm font-semibold text-gray-600 bg-blue-50">
                    From Completed Circuit Quotes
                  </div>
                  {carrierQuoteItems.map((carrierItem) => (
                    <SelectItem key={`carrier-${carrierItem.id}`} value={`carrier-${carrierItem.id}`}>
                      <div className="flex flex-col w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{carrierItem.carrier}</span>
                          <Badge variant="outline" className="text-xs">
                            Circuit Quote
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-600">
                          {carrierItem.type} - {carrierItem.speed}
                        </span>
                        <span className="text-sm text-green-600 font-medium">
                          ${carrierItem.price.toFixed(2)}/month
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              
              {availableItems.length === 0 && !hasCarrierItems && (
                <SelectItem value="no-items" disabled>
                  No items available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          
          <Button
            onClick={onAddItem}
            disabled={disabled || !selectedItemId || isLoading || carrierLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading || carrierLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Item
          </Button>
        </div>
        
        {!clientInfoId && (
          <p className="text-sm text-orange-600">
            Select a client company to see items from completed circuit quotes
          </p>
        )}
        
        {clientInfoId && hasCarrierItems && (
          <p className="text-sm text-blue-600">
            {carrierQuoteItems.length} carrier option(s) available from completed circuit quotes
          </p>
        )}
      </div>
    </div>
  );
};
