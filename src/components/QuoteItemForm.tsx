
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Package, Zap } from "lucide-react";
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
  const [selectedCarrierItemId, setSelectedCarrierItemId] = useState<string>("");

  // Get agent commission rate from clients data
  const currentAgent = clients.find(client => client.id === user?.id);
  const agentCommissionRate = currentAgent?.commissionRate || 15;

  // Helper function to extract term months from term string
  const getTermMonths = (term: string | undefined): number => {
    if (!term) return 36;
    
    const termLower = term.toLowerCase();
    const monthMatch = termLower.match(/(\d+)\s*month/);
    const yearMatch = termLower.match(/(\d+)\s*year/);
    
    if (monthMatch) {
      return parseInt(monthMatch[1]);
    } else if (yearMatch) {
      return parseInt(yearMatch[1]) * 12;
    }
    
    return 36;
  };

  // Calculate total cost including all add-ons for cost display
  const calculateTotalCostWithAddons = (carrierItem: any) => {
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

    return totalCost;
  };

  const calculateSellPrice = (carrierItem: any, commissionRate: number = agentCommissionRate) => {
    const totalCostWithAddons = calculateTotalCostWithAddons(carrierItem);

    if (isAdmin) {
      return totalCostWithAddons;
    }

    if (!carrierItem.type || !categories.length) {
      return totalCostWithAddons;
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
      return Math.round(totalCostWithAddons * (1 + markup) * 100) / 100;
    }

    return totalCostWithAddons;
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
    setSelectedCarrierItemId("");
    onSelectedItemIdChange("");
  };

  // Handle carrier selection
  const handleCarrierChange = (carrier: string) => {
    setSelectedCarrier(carrier);
    setSelectedCarrierItemId("");
    onSelectedItemIdChange("");
  };

  // Handle speed selection - use the carrier item ID
  const handleSpeedChange = (carrierItemId: string) => {
    setSelectedCarrierItemId(carrierItemId);
    onSelectedItemIdChange(`carrier-${carrierItemId}`);
  };

  // Reset multi-step selection when switching between catalog and carrier items
  const handleCatalogItemChange = (value: string) => {
    setSelectedAddress("");
    setSelectedCarrier("");
    setSelectedCarrierItemId("");
    onSelectedItemIdChange(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Label className="text-lg font-semibold text-gray-900">Add Items to Quote</Label>
        <p className="text-sm text-gray-600 mt-1">Choose items from your catalog or from completed circuit quotes</p>
      </div>

      {/* Two Column Layout - Swapped positions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Circuit Quote Items */}
        <div className="space-y-4 p-6 border-2 border-emerald-200 rounded-lg bg-emerald-50/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <Label className="text-lg font-semibold text-emerald-900">Circuit Quotes</Label>
              <p className="text-sm text-emerald-700">Select from completed circuit quotes</p>
            </div>
          </div>
          
          {!clientInfoId && (
            <div className="p-4 bg-orange-100 border border-orange-300 rounded-md">
              <p className="text-sm text-orange-700 font-medium">
                Select a client company first to see circuit quote options
              </p>
            </div>
          )}
          
          {clientInfoId && !hasCarrierItems && !carrierLoading && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-md">
              <p className="text-sm text-red-700 font-medium">
                No circuit quotes found for this client
              </p>
              <p className="text-xs text-red-600 mt-1">
                Complete a circuit quote first to see options here
              </p>
            </div>
          )}

          {clientInfoId && hasCarrierItems && (
            <div className="space-y-4">
              {/* Step 1: Select Address */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-emerald-800">Step 1: Select Location</Label>
                <Select 
                  value={selectedAddress} 
                  onValueChange={handleAddressChange}
                  disabled={carrierLoading}
                >
                  <SelectTrigger className="bg-white border-emerald-300 focus:border-emerald-500">
                    <SelectValue placeholder={carrierLoading ? "Loading locations..." : "Select location"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-emerald-200 shadow-lg z-[100] max-w-sm">
                    {uniqueAddresses.map((address) => (
                      <SelectItem 
                        key={address} 
                        value={address} 
                        className="cursor-pointer hover:bg-emerald-50 px-3 py-2 text-sm"
                      >
                        {address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Carrier */}
              {selectedAddress && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-emerald-800">Step 2: Select Carrier</Label>
                  <Select 
                    value={selectedCarrier} 
                    onValueChange={handleCarrierChange}
                  >
                    <SelectTrigger className="bg-white border-emerald-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-emerald-200 shadow-lg z-[100] max-w-sm">
                      {carriersForAddress.map((carrier) => (
                        <SelectItem 
                          key={carrier} 
                          value={carrier} 
                          className="cursor-pointer hover:bg-emerald-50 px-3 py-2 text-sm"
                        >
                          {carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 3: Select Speed */}
              {selectedAddress && selectedCarrier && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-emerald-800">Step 3: Select Speed & Service</Label>
                  <Select 
                    value={selectedCarrierItemId} 
                    onValueChange={handleSpeedChange}
                  >
                    <SelectTrigger className="bg-white border-emerald-300 focus:border-emerald-500">
                      <SelectValue placeholder="Select speed and service type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-emerald-200 shadow-lg z-[100] max-h-96 overflow-y-auto">
                      {speedsForSelection.map((carrierItem) => {
                        const sellPrice = calculateSellPrice(carrierItem, agentCommissionRate);
                        return (
                          <SelectItem 
                            key={carrierItem.id} 
                            value={carrierItem.id}
                            className="cursor-pointer hover:bg-emerald-50 px-3 py-2"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <span className="font-medium text-sm">{carrierItem.speed}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{carrierItem.type}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-green-600 font-medium">${sellPrice.toFixed(2)}/month</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-md">
                <p className="text-sm text-emerald-700 font-medium">
                  {availableCarrierItems.length} carrier option(s) available
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  From completed circuit quotes for this client
                </p>
              </div>
            </div>
          )}

          {carrierLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
              <span className="ml-2 text-sm text-emerald-700">Loading circuit quotes...</span>
            </div>
          )}
        </div>

        {/* Right Column - Catalog Items */}
        <div className="space-y-4 p-6 border-2 border-blue-200 rounded-lg bg-blue-50/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <Label className="text-lg font-semibold text-blue-900">Item Catalog</Label>
              <p className="text-sm text-blue-700">Select from your pre-configured items</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Select 
              value={selectedItemId.startsWith('carrier-') ? '' : selectedItemId} 
              onValueChange={handleCatalogItemChange}
            >
              <SelectTrigger className="bg-white border-blue-300 focus:border-blue-500">
                <SelectValue placeholder={isLoading ? "Loading catalog items..." : "Select from catalog"} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-blue-200 shadow-lg z-[100] max-w-lg">
                {availableItems.length > 0 ? (
                  availableItems.map((item) => (
                    <SelectItem 
                      key={item.id} 
                      value={item.id} 
                      className="cursor-pointer hover:bg-blue-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3 w-full">
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
                        <Badge variant="outline" className="text-xs ml-auto bg-blue-100 text-blue-700 border-blue-300">
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
            
            {availableItems.length > 0 && (
              <p className="text-sm text-blue-600 font-medium">
                {availableItems.length} item(s) available in catalog
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Button - Full Width */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          onClick={onAddItem}
          disabled={disabled || !selectedItemId || isLoading || carrierLoading}
          className="bg-blue-700 hover:bg-blue-800 w-full h-12 text-base"
        >
          {isLoading || carrierLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Plus className="h-5 w-5 mr-2" />
          )}
          Add Selected Item to Quote
        </Button>
      </div>
    </div>
  );
};
