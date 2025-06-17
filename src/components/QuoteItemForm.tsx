
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
      <div className="space-y-4">
        <Label>Add Item to Quote</Label>
        
        {/* Catalog Items Dropdown */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">From Item Catalog</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedItemId.startsWith('carrier-') ? '' : selectedItemId} 
              onValueChange={onSelectedItemIdChange}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={isLoading ? "Loading catalog items..." : "Select from catalog"} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {availableItems.length > 0 ? (
                  availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-sm text-gray-500">${item.price}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-items" disabled>
                    No catalog items available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Carrier Quote Items Dropdown */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">From Completed Circuit Quotes</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedItemId.startsWith('carrier-') ? selectedItemId : ''} 
              onValueChange={onSelectedItemIdChange}
              disabled={!clientInfoId || !hasCarrierItems}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={
                  !clientInfoId 
                    ? "Select a client company first" 
                    : carrierLoading 
                      ? "Loading carrier quotes..." 
                      : !hasCarrierItems 
                        ? "No carrier quotes available" 
                        : "Select from carrier quotes"
                } />
              </SelectTrigger>
              <SelectContent className="bg-white z-50 min-w-[500px]">
                {hasCarrierItems ? (
                  carrierQuoteItems.map((carrierItem) => (
                    <SelectItem key={`carrier-${carrierItem.id}`} value={`carrier-${carrierItem.id}`}>
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <span className="font-medium text-sm">{carrierItem.carrier}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-600">{carrierItem.type}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-600">{carrierItem.speed}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-green-600 font-medium">${carrierItem.price.toFixed(2)}/month</span>
                        <Badge variant="outline" className="text-xs whitespace-nowrap ml-auto">
                          Circuit Quote
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-carrier-items" disabled>
                    No carrier quotes available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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

        {/* Add Button */}
        <Button
          onClick={onAddItem}
          disabled={disabled || !selectedItemId || isLoading || carrierLoading}
          className="bg-blue-600 hover:bg-blue-700 w-full"
        >
          {isLoading || carrierLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Item to Quote
        </Button>
      </div>
    </div>
  );
};
