
import { useState } from "react";
import { QuoteItemData } from "@/types/quoteItems";
import { useItems } from "@/hooks/useItems";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { useCarrierQuoteItems } from "@/hooks/useCarrierQuoteItems";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/context/AuthContext";
import { useClients } from "@/hooks/useClients";
import { parseLocationToAddress } from "@/utils/addressParser";

export const useQuoteItemActions = (clientInfoId?: string) => {
  const { items: availableItems, isLoading } = useItems();
  const { addresses, addAddress } = useClientAddresses(clientInfoId || null);
  const { carrierQuoteItems } = useCarrierQuoteItems(clientInfoId || null);
  const { categories } = useCategories();
  const { user, isAdmin } = useAuth();
  const { clients } = useClients();
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isAddingCarrierItem, setIsAddingCarrierItem] = useState(false);

  // Get agent commission rate from clients data
  const currentAgent = clients.find(client => client.id === user?.id);
  const agentCommissionRate = currentAgent?.commissionRate || 15;
  const isAgentOptedOut = agentCommissionRate === 0;

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

  // Calculate total cost including all add-ons for admin cost display
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

    // If agent is opted out of commission, return the total cost as sell price
    if (isAgentOptedOut) {
      return totalCostWithAddons;
    }

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

  const addCarrierItem = async (carrierQuoteId: string, items: QuoteItemData[], onItemsChange: (items: QuoteItemData[]) => void) => {
    if (!clientInfoId) {
      console.error('No clientInfoId provided for carrier item');
      return;
    }
    
    setIsAddingCarrierItem(true);
    
    try {
      const carrierItem = carrierQuoteItems.find(item => item.id === carrierQuoteId);
      
      if (!carrierItem) {
        console.error('Carrier item not found:', carrierQuoteId);
        return;
      }

      let matchingAddress = null;
      
      // Only try to create/find address if location is provided and meaningful
      if (carrierItem.location && carrierItem.location.trim() && carrierItem.location.toLowerCase() !== 'n/a') {
        // Look for an existing address that matches the carrier quote location first
        matchingAddress = addresses.find(addr => {
          const addressString = `${addr.street_address}${addr.street_address_2 ? `, ${addr.street_address_2}` : ''}, ${addr.city}, ${addr.state} ${addr.zip_code}`;
          return addressString.toLowerCase().includes(carrierItem.location.toLowerCase()) ||
                 carrierItem.location.toLowerCase().includes(addressString.toLowerCase());
        });

        // If no exact match found, try to create a new address
        if (!matchingAddress) {
          try {
            const parsedAddress = parseLocationToAddress(carrierItem.location);
            
            // Only create address if we have meaningful parsed data
            if (parsedAddress.city && parsedAddress.state) {
              const newAddressData = {
                client_info_id: clientInfoId,
                address_type: 'service',
                street_address: parsedAddress.street_address || carrierItem.location.split(',')[0]?.trim() || 'Service Location',
                city: parsedAddress.city,
                state: parsedAddress.state,
                zip_code: parsedAddress.zip_code || '',
                country: 'United States',
                is_primary: false
              };

              matchingAddress = await addAddress(newAddressData);
            }
          } catch (error) {
            console.error('Error creating address for carrier location:', error);
            // Don't throw - continue without address
          }
        }
      }

      // If still no address, use the primary address or first available
      if (!matchingAddress) {
        matchingAddress = addresses.find(addr => addr.is_primary) || addresses[0] || null;
      }

      // Find matching category for the carrier type to get category_id
      const matchingCategory = categories.find(cat => 
        cat.type?.toLowerCase() === carrierItem.type.toLowerCase() ||
        cat.name.toLowerCase().includes(carrierItem.type.toLowerCase())
      );

      // Calculate sell price using category markup with current agent commission rate and including add-ons
      const sellPrice = calculateSellPrice(carrierItem, agentCommissionRate);
      
      // Calculate the total cost including add-ons for cost_override (admin display)
      const totalCostWithAddons = calculateTotalCostWithAddons(carrierItem);

      // Create a temporary quote item for the carrier quote
      const quoteItem: QuoteItemData = {
        id: `temp-carrier-${Date.now()}`,
        item_id: `carrier-${carrierItem.id}`,
        quantity: 1,
        unit_price: sellPrice,
        cost_override: isAdmin ? totalCostWithAddons : undefined, // For admins, show total cost including all add-ons
        total_price: sellPrice,
        charge_type: 'MRC',
        address_id: matchingAddress?.id,
        name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
        description: '',
        item: {
          id: `carrier-${carrierItem.id}`,
          user_id: '',
          name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
          description: '',
          price: sellPrice,
          cost: isAdmin ? totalCostWithAddons : sellPrice, // For admins, use total cost including add-ons; for agents, use sell price
          charge_type: 'MRC',
          is_active: true,
          category_id: matchingCategory?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        address: matchingAddress
      };

      // Add to items list
      const newItems = [...items, quoteItem];
      onItemsChange(newItems);
      setSelectedItemId("");
      
    } catch (error) {
      console.error('Error adding carrier item:', error);
      // Don't throw the error, just log it and reset the loading state
    } finally {
      setIsAddingCarrierItem(false);
    }
  };

  const addRegularItem = (items: QuoteItemData[], onItemsChange: (items: QuoteItemData[]) => void) => {
    const selectedItem = availableItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;

    const newItem: QuoteItemData = {
      id: `temp-${Date.now()}`,
      item_id: selectedItemId,
      quantity: 1,
      unit_price: selectedItem.price,
      cost_override: isAdmin ? selectedItem.cost : undefined,
      total_price: selectedItem.price,
      charge_type: (selectedItem.charge_type as 'NRC' | 'MRC') || 'NRC',
      address_id: addresses.length > 0 ? addresses[0].id : undefined,
      name: selectedItem.name,
      description: selectedItem.description || '',
      item: selectedItem,
      address: addresses.length > 0 ? addresses[0] : undefined
    };

    onItemsChange([...items, newItem]);
    setSelectedItemId("");
  };

  return {
    selectedItemId,
    setSelectedItemId,
    availableItems,
    isLoading,
    isAddingCarrierItem,
    addCarrierItem,
    addRegularItem,
    addresses,
    carrierQuoteItems,
    agentCommissionRate,
    isAgentOptedOut
  };
};
