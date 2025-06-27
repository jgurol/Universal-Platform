
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
import { useState, useMemo } from "react";

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

  // Multi-step selection state
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");
  const [selectedSpeed, setSelectedSpeed] = useState<string>("");

  // Get agent commission rate from clients data
  const currentAgent = clients.find(client => client.id === user?.id);
  const agentCommissionRate = currentAgent?.commissionRate || 15;

  // Helper function to extract term months from term string
  const getTermMonths = (term: string | undefined): number => {
    if (!term) return 36; // Default to 36 months if no term specified
    
    const termLower = term.toLowerCase();
    const monthMatch = termLower.match(/(\d+)\s*month/);
    const yearMatch = termLower.match(/(\d+)\s*year/);
    
    if (monthMatch) {
      return parseInt(monthMatch[1]);
    } else if (yearMatch) {
      return parseInt(yearMatch[1]) * 12;
    }
    
    return 36; // Default fallback
  };

  const calculateSellPrice = (carrierItem: any, commissionRate: number = agentCommissionRate) => {
    const termMonths = getTermMonths(carrierItem.term);
    
    // Start with base price
    let totalCost = carrierItem.price;
    
    // Add static IP fees
    if (carrierItem.static_ip && carrierItem.static_ip_fee_amount) {
      totalCost += carrierItem.static_ip_fee_amount;
    }
    if (carrierItem.static_ip_5 && carrierItem.static_ip_5_fee_amount) {
      totalCost += carrierItem.static_ip_5_fee_amount;
    }
    
    // Add amortized install fee (divided by contract term in months)
    if (carrierItem.install_fee && carrierItem.install_fee_amount) {
      totalCost += carrierItem.install_fee_amount / termMonths;
    }
    
    // Add other costs
    if (carrierItem.other_costs) {
      totalCost += carrierItem.other_costs;
    }

    if (isAdmin) {
      return totalCost;
    }

    if (!carrierItem.type || !categories.length) {
      return totalCost; // If no category or categories not loaded, return total cost as sell price
    }

    // Find the category that matches the carrier quote type
    const matchingCategory = categories.find(cat => 
      cat.type?.toLowerCase() === carrierItem.type.toLowerCase() ||
      cat.name.toLowerCase().includes(carrierItem.type.toLowerCase())
    );

    if (matchingCategory && matchingCategory.minimum_markup && matchingCategory.minimum_markup > 0) {
      // Calculate effective minimum markup after commission reduction
      const originalMinimumMarkup = matchingCategory.minimum_markup;
      const commissionReduction = agentCommissionRate - commissionRate;
      const effectiveMinimumMarkup = Math.max(0, originalMinimumMarkup - commissionReduction);
      
      // Apply the effective minimum markup: sell price = cost * (1 + effectiveMinimumMarkup/100)
      const markup = effectiveMinimumMarkup / 100;
      return Math.round(totalCost * (1 + markup) * 100) / 100; // Round to 2 decimal places
    }

    return totalCost; // If no matching category or no minimum markup, return total cost
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
  
  const hasCarrierItems = availableCarrierItems.length > 0;

  console.log('[QuoteItemForm] After filtering no_service items:', {
    originalCount: carrierQuoteItems.length,
    filteredCount: availableCarrierItems.length,
    hasCarrierItems
  });

  // Get unique addresses from carrier quote items
  const uniqueAddresses = useMemo(() => {
    const addresses = [...new Set(availableCarrierItems.map(item => item.location))];
    return addresses.sort();
  }, [availableCarrierItems]);

  // Get carriers for selected address
  const carriersForAddress = useMemo(() => {
    if (!selectedAddress) return [];
    const carriers = [...new Set(availableCarrierItems
      .filter(item => item.location === selectedAddress)
      .map(item => item.carrier))];
    return carriers.sort();
  }, [availableCarrierItems, selectedAddress]);

  // Get speeds for selected address and carrier
  const speedsForSelection = useMemo(() => {
    if (!selectedAddress || !selectedCarrier) return [];
    return availableCarrierItems
      .filter(item => item.location === selectedAddress && item.carrier === selectedCarrier)
      .sort((a, b) => a.speed.localeCompare(b.speed));
  }, [availableCarrierItems, selectedAddress, selectedCarrier]);

  // Handle address selection
  const handleAddressChange = (address: string) => {
    setSelectedAddress(address);
    setSelectedCarrier("");
    setSelectedSpeed("");
    onSelectedItemIdChange("");
  };

  // Handle carrier selection
  const handleCarrierChange = (carrier: string) => {
    setSelectedCarrier(carrier);
    setSelectedSpeed("");
    onSelectedItemIdChange("");
  };

  // Handle speed selection
  const handleSpeedChange = (speed: string) => {
    setSelectedSpeed(speed);
    const selectedItem = speedsForSelection.find(item => item.speed === speed);
    if (selectedItem) {
      onSelectedItemIdChange(`carrier-${selectedItem.id}`);
    }
  };

  // Reset multi-step selection when switching between catalog and carrier items
  const handleCatalogItemChange = (value: string) => {
    setSelectedAddress("");
    setSelectedCarrier("");
    setSelectedSpeed("");
    onSelectedItemIdChange(value);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground">
      <div className="space-y-4">
        <Label>Add Item to Quote</Label>
        
        {/* Catalog Items Dropdown */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">From Item Catalog</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedItemId.startsWith('carrier-') ? '' : selectedItemId} 
              onValueChange={handleCatalogItemChange}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={isLoading ? "Loading catalog items..." : "Select from catalog"} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 min-w-[500px]">
                {availableItems.length > 0 ? (
                  availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{item.charge_type}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-green-600 font-medium">${item.price}</span>
                        {isAdmin && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
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

        {/* Carrier Quote Items Multi-Step Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">From Completed Circuit Quotes</Label>
          
          {!clientInfoId && (
            <p className="text-sm text-orange-600">
              Select a client company to see items from completed circuit quotes
            </p>
          )}
          
          {clientInfoId && !hasCarrierItems && !carrierLoading && (
            <p className="text-sm text-red-600">
              No carrier quotes found. Make sure you have completed circuit quotes for this client.
            </p>
          )}

          {clientInfoId && hasCarrierItems && (
            <div className="space-y-3">
              {/* Step 1: Select Address */}
              <div>
                <Label className="text-xs text-gray-600">Step 1: Select Location</Label>
                <Select 
                  value={selectedAddress} 
                  onValueChange={handleAddressChange}
                  disabled={carrierLoading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={carrierLoading ? "Loading locations..." : "Select location"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50 min-w-[400px]">
                    {uniqueAddresses.map((address) => (
                      <SelectItem key={address} value={address}>
                        {address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Carrier */}
              {selectedAddress && (
                <div>
                  <Label className="text-xs text-gray-600">Step 2: Select Carrier</Label>
                  <Select 
                    value={selectedCarrier} 
                    onValueChange={handleCarrierChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50 min-w-[300px]">
                      {carriersForAddress.map((carrier) => (
                        <SelectItem key={carrier} value={carrier}>
                          {carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 3: Select Speed */}
              {selectedAddress && selectedCarrier && (
                <div>
                  <Label className="text-xs text-gray-600">Step 3: Select Speed & Service</Label>
                  <Select 
                    value={selectedSpeed} 
                    onValueChange={handleSpeedChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select speed and service type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50 min-w-[600px]">
                      {speedsForSelection.map((carrierItem) => {
                        const sellPrice = calculateSellPrice(carrierItem, agentCommissionRate);
                        const baseCost = carrierItem.price;
                        return (
                          <SelectItem key={carrierItem.id} value={carrierItem.speed}>
                            <div className="flex items-center gap-3 w-full min-w-0 whitespace-nowrap">
                              <span className="font-medium text-sm">{carrierItem.speed}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{carrierItem.type}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-green-600 font-medium">${sellPrice.toFixed(2)}/month</span>
                              {isAdmin && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-orange-600">Base Cost: ${baseCost.toFixed(2)}</span>
                                </>
                              )}
                              <Badge variant="outline" className="text-xs whitespace-nowrap ml-auto">
                                Circuit Quote
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {clientInfoId && hasCarrierItems && (
            <p className="text-sm text-blue-600">
              {availableCarrierItems.length} carrier option(s) available from completed circuit quotes
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
