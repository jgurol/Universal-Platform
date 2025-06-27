
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { Item } from "@/types/items";
import { useCarrierQuoteItems } from "@/hooks/useCarrierQuoteItems";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { useClients } from "@/hooks/useClients";

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
  const { isAdmin, user } = useAuth();
  const { categories } = useCategories();
  const { clients } = useClients();

  // Get agent commission rate from clients data
  const currentAgent = clients.find(client => client.id === user?.id);
  const agentCommissionRate = currentAgent?.commissionRate || 15;

  const calculateSellPrice = (cost: number, categoryType?: string, commissionRate: number = agentCommissionRate) => {
    if (!categoryType || !categories.length) {
      return cost; // If no category or categories not loaded, return cost as sell price
    }

    // Find the category that matches the carrier quote type
    const matchingCategory = categories.find(cat => 
      cat.type?.toLowerCase() === categoryType.toLowerCase() ||
      cat.name.toLowerCase().includes(categoryType.toLowerCase())
    );

    if (matchingCategory && matchingCategory.minimum_markup && matchingCategory.minimum_markup > 0) {
      // Calculate effective minimum markup after commission reduction
      const originalMinimumMarkup = matchingCategory.minimum_markup;
      const commissionReduction = agentCommissionRate - commissionRate;
      const effectiveMinimumMarkup = Math.max(0, originalMinimumMarkup - commissionReduction);
      
      // Apply the effective minimum markup: sell price = cost * (1 + effectiveMinimumMarkup/100)
      const markup = effectiveMinimumMarkup / 100;
      return Math.round(cost * (1 + markup) * 100) / 100; // Round to 2 decimal places
    }

    return cost; // If no matching category or no minimum markup, return cost
  };

  console.log('[QuoteItemForm] Debug info:', {
    clientInfoId,
    carrierQuoteItemsCount: carrierQuoteItems.length,
    carrierLoading,
    carrierQuoteItems: carrierQuoteItems.map(item => ({
      id: item.id,
      carrier: item.carrier,
      type: item.type,
      no_service: item.no_service
    }))
  });

  // Filter out carrier items that have no_service set to true
  const availableCarrierItems = carrierQuoteItems.filter(item => !item.no_service);
  
  // Sort by vendor/carrier first, then by speed
  const sortedCarrierItems = availableCarrierItems.sort((a, b) => {
    // First sort by carrier name
    const carrierComparison = a.carrier.localeCompare(b.carrier);
    if (carrierComparison !== 0) {
      return carrierComparison;
    }
    
    // If carriers are the same, sort by speed
    return a.speed.localeCompare(b.speed);
  });
  
  const hasCarrierItems = sortedCarrierItems.length > 0;

  console.log('[QuoteItemForm] After filtering no_service items:', {
    originalCount: carrierQuoteItems.length,
    filteredCount: availableCarrierItems.length,
    hasCarrierItems
  });

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
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
              <SelectContent className="bg-white z-50 min-w-[500px]">
                {availableItems.length > 0 ? (
                  availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-600">{item.charge_type}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-green-600 font-medium">${item.price}</span>
                        {isAdmin && (
                          <>
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-orange-600">Cost: ${item.cost}</span>
                          </>
                        )}
                        <Badge variant="outline" className="text-xs whitespace-nowrap ml-auto">
                          Catalog
                        </Badge>
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
              <SelectContent className="bg-white z-50 min-w-[700px]">
                {hasCarrierItems ? (
                  sortedCarrierItems.map((carrierItem) => {
                    const sellPrice = calculateSellPrice(carrierItem.price, carrierItem.type, agentCommissionRate);
                    return (
                      <SelectItem key={`carrier-${carrierItem.id}`} value={`carrier-${carrierItem.id}`}>
                        <div className="flex items-center gap-3 w-full min-w-0 whitespace-nowrap">
                          <span className="font-medium text-sm">{carrierItem.carrier}</span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-600">{carrierItem.type}</span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-gray-600">{carrierItem.speed}</span>
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-green-600 font-medium">${sellPrice.toFixed(2)}/month</span>
                          {isAdmin && (
                            <>
                              <span className="text-xs text-gray-600">•</span>
                              <span className="text-xs text-orange-600">Cost: ${carrierItem.price.toFixed(2)}</span>
                            </>
                          )}
                          <span className="text-xs text-gray-600">•</span>
                          <span className="text-xs text-blue-600">{carrierItem.location}</span>
                          <Badge variant="outline" className="text-xs whitespace-nowrap ml-auto">
                            Circuit Quote
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })
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
              {sortedCarrierItems.length} carrier option(s) available from completed circuit quotes
            </p>
          )}
          
          {clientInfoId && !hasCarrierItems && !carrierLoading && (
            <p className="text-sm text-red-600">
              No carrier quotes found. Make sure you have completed circuit quotes for this client.
            </p>
          )}
        </div>

        {/* Add Button */}
        <Button
          onClick={onAddItem}
          disabled={disabled || !selectedItemId || isLoading || carrierLoading}
          className="bg-blue-700 hover:bg-blue-800 w-full"
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
