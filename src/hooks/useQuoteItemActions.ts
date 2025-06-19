
import { useState } from "react";
import { QuoteItemData } from "@/types/quoteItems";
import { useItems } from "@/hooks/useItems";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { useCarrierQuoteItems } from "@/hooks/useCarrierQuoteItems";
import { useCategories } from "@/hooks/useCategories";
import { parseLocationToAddress } from "@/utils/addressParser";

export const useQuoteItemActions = (clientInfoId?: string) => {
  const { items: availableItems, isLoading } = useItems();
  const { addresses, addAddress } = useClientAddresses(clientInfoId || null);
  const { carrierQuoteItems } = useCarrierQuoteItems(clientInfoId || null);
  const { categories } = useCategories();
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isAddingCarrierItem, setIsAddingCarrierItem] = useState(false);

  const calculateSellPrice = (cost: number, categoryType?: string) => {
    if (!categoryType || !categories.length) {
      return cost; // If no category or categories not loaded, return cost as sell price
    }

    // Find the category that matches the carrier quote type
    const matchingCategory = categories.find(cat => 
      cat.type?.toLowerCase() === categoryType.toLowerCase() ||
      cat.name.toLowerCase().includes(categoryType.toLowerCase())
    );

    if (matchingCategory && matchingCategory.standard_markup && matchingCategory.standard_markup > 0) {
      // Apply the markup: sell price = cost * (1 + markup/100)
      const markup = matchingCategory.standard_markup / 100;
      return Math.round(cost * (1 + markup) * 100) / 100; // Round to 2 decimal places
    }

    return cost; // If no matching category or no markup, return cost
  };

  const addCarrierItem = async (carrierQuoteId: string, items: QuoteItemData[], onItemsChange: (items: QuoteItemData[]) => void) => {
    if (!clientInfoId) {
      console.error('[useQuoteItemActions] No clientInfoId provided for carrier item');
      return;
    }
    
    setIsAddingCarrierItem(true);
    
    try {
      const carrierItem = carrierQuoteItems.find(item => item.id === carrierQuoteId);
      
      if (!carrierItem) {
        console.error('[useQuoteItemActions] Carrier item not found:', carrierQuoteId);
        return;
      }

      console.log('[useQuoteItemActions] Processing carrier item:', carrierItem);
      
      let matchingAddress = null;
      
      // Only try to create/find address if location is provided and meaningful
      if (carrierItem.location && carrierItem.location.trim() && carrierItem.location.toLowerCase() !== 'n/a') {
        // Parse the location into address components
        const parsedAddress = parseLocationToAddress(carrierItem.location);
        console.log('[useQuoteItemActions] Parsed address from location:', parsedAddress);
        
        // Look for an existing address that matches the carrier quote location
        matchingAddress = addresses.find(addr => {
          const addressString = `${addr.street_address}${addr.street_address_2 ? `, ${addr.street_address_2}` : ''}, ${addr.city}, ${addr.state} ${addr.zip_code}`;
          return addressString.toLowerCase().includes(carrierItem.location.toLowerCase()) ||
                 carrierItem.location.toLowerCase().includes(addressString.toLowerCase()) ||
                 (addr.city.toLowerCase() === parsedAddress.city.toLowerCase() && 
                  addr.state.toLowerCase() === parsedAddress.state.toLowerCase());
        });

        // If no matching address exists and we have meaningful location data, create one
        if (!matchingAddress && (parsedAddress.city || parsedAddress.state)) {
          try {
            const newAddressData = {
              client_info_id: clientInfoId,
              address_type: 'service',
              street_address: parsedAddress.street_address || carrierItem.location.split(',')[0] || 'Service Location',
              city: parsedAddress.city || 'Unknown',
              state: parsedAddress.state || 'Unknown',
              zip_code: parsedAddress.zip_code || '',
              country: 'United States',
              is_primary: false // Don't make carrier locations primary
            };

            console.log('[useQuoteItemActions] Creating new address for carrier location:', newAddressData);
            matchingAddress = await addAddress(newAddressData);
            console.log('[useQuoteItemActions] Created address for carrier location:', matchingAddress);
          } catch (error) {
            console.error('[useQuoteItemActions] Error creating address for carrier location:', error);
            // Continue without creating address if it fails - use existing primary address
            matchingAddress = addresses.find(addr => addr.is_primary);
          }
        }
      }

      // If still no address, use the primary address or first available
      if (!matchingAddress) {
        matchingAddress = addresses.find(addr => addr.is_primary) || addresses[0] || null;
        console.log('[useQuoteItemActions] Using fallback address:', matchingAddress);
      }

      // Calculate sell price using category markup
      const sellPrice = calculateSellPrice(carrierItem.price, carrierItem.type);
      console.log('[useQuoteItemActions] Calculated sell price:', {
        cost: carrierItem.price,
        type: carrierItem.type,
        sellPrice: sellPrice,
        markup: sellPrice > carrierItem.price ? ((sellPrice - carrierItem.price) / carrierItem.price * 100).toFixed(1) + '%' : 'none'
      });

      // Create a temporary quote item for the carrier quote
      const quoteItem: QuoteItemData = {
        id: `temp-carrier-${Date.now()}`,
        item_id: `carrier-${carrierItem.id}`,
        quantity: 1,
        unit_price: sellPrice, // Use calculated sell price with markup
        cost_override: carrierItem.price,
        total_price: sellPrice, // Total equals unit price for quantity 1
        charge_type: 'MRC',
        address_id: matchingAddress?.id,
        name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
        description: '', // Leave description blank
        item: {
          id: `carrier-${carrierItem.id}`,
          user_id: '',
          name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
          description: '', // Leave description blank
          price: sellPrice, // Set price to calculated sell price
          cost: carrierItem.price,
          charge_type: 'MRC',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        address: matchingAddress // This should be the address that matches the carrier location
      };

      console.log('[useQuoteItemActions] Adding carrier item to quote:', {
        itemName: quoteItem.name,
        carrierLocation: carrierItem.location,
        addressId: quoteItem.address_id,
        addressDetails: quoteItem.address,
        originalCost: carrierItem.price,
        sellPrice: sellPrice,
        markupApplied: sellPrice !== carrierItem.price
      });

      // Add to items list
      const newItems = [...items, quoteItem];
      onItemsChange(newItems);
      setSelectedItemId("");
      
      console.log('[useQuoteItemActions] Successfully added carrier item to quote');
    } catch (error) {
      console.error('[useQuoteItemActions] Error adding carrier item:', error);
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
      cost_override: selectedItem.cost,
      total_price: selectedItem.price,
      charge_type: (selectedItem.charge_type as 'NRC' | 'MRC') || 'NRC',
      address_id: addresses.length > 0 ? addresses[0].id : undefined,
      name: selectedItem.name,
      description: selectedItem.description || '',
      item: selectedItem,
      address: addresses.length > 0 ? addresses[0] : undefined
    };

    // Add to the items list
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
    carrierQuoteItems
  };
};
