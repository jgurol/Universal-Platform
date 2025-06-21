
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

    if (matchingCategory && matchingCategory.minimum_markup && matchingCategory.minimum_markup > 0) {
      // Apply the minimum markup: sell price = cost * (1 + markup/100)
      const markup = matchingCategory.minimum_markup / 100;
      return Math.round(cost * (1 + markup) * 100) / 100; // Round to 2 decimal places
    }

    return cost; // If no matching category or no markup, return cost
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

      console.log('[addCarrierItem] Processing carrier item:', {
        id: carrierItem.id,
        location: carrierItem.location,
        carrier: carrierItem.carrier,
        type: carrierItem.type,
        speed: carrierItem.speed,
        price: carrierItem.price
      });

      let matchingAddress = null;
      
      // Only try to create/find address if location is provided and meaningful
      if (carrierItem.location && carrierItem.location.trim() && carrierItem.location.toLowerCase() !== 'n/a') {
        console.log('[addCarrierItem] Looking for address match for location:', carrierItem.location);
        
        // Look for an existing address that matches the carrier quote location first
        matchingAddress = addresses.find(addr => {
          const addressString = `${addr.street_address}${addr.street_address_2 ? `, ${addr.street_address_2}` : ''}, ${addr.city}, ${addr.state} ${addr.zip_code}`;
          const locationMatch = addressString.toLowerCase().includes(carrierItem.location.toLowerCase()) ||
                 carrierItem.location.toLowerCase().includes(addressString.toLowerCase());
          
          console.log('[addCarrierItem] Comparing addresses:', {
            existing: addressString,
            carrier: carrierItem.location,
            match: locationMatch
          });
          
          return locationMatch;
        });

        // If no exact match found, try to create a new address from the location
        if (!matchingAddress) {
          console.log('[addCarrierItem] No existing address match, attempting to parse location');
          
          try {
            const parsedAddress = parseLocationToAddress(carrierItem.location);
            console.log('[addCarrierItem] Parsed address:', parsedAddress);
            
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

              console.log('[addCarrierItem] Creating new address:', newAddressData);
              matchingAddress = await addAddress(newAddressData);
              console.log('[addCarrierItem] Created address:', matchingAddress);
            } else {
              console.log('[addCarrierItem] Insufficient parsed address data, skipping address creation');
            }
          } catch (error) {
            console.error('Error creating address for carrier location:', error);
            // Don't throw - continue without address
          }
        } else {
          console.log('[addCarrierItem] Found existing matching address:', matchingAddress);
        }
      } else {
        console.log('[addCarrierItem] No meaningful location provided, skipping address lookup');
      }

      // If still no address, use the primary address or first available
      if (!matchingAddress && addresses.length > 0) {
        matchingAddress = addresses.find(addr => addr.is_primary) || addresses[0];
        console.log('[addCarrierItem] Using fallback address:', matchingAddress);
      }

      // Calculate sell price using category minimum markup
      const sellPrice = calculateSellPrice(carrierItem.price, carrierItem.type);

      // Create a temporary quote item for the carrier quote
      const quoteItem: QuoteItemData = {
        id: `temp-carrier-${Date.now()}`,
        item_id: `carrier-${carrierItem.id}`,
        quantity: 1,
        unit_price: sellPrice,
        cost_override: carrierItem.price,
        total_price: sellPrice,
        charge_type: 'MRC',
        address_id: matchingAddress?.id,
        name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
        description: carrierItem.location || '',
        item: {
          id: `carrier-${carrierItem.id}`,
          user_id: '',
          name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
          description: carrierItem.location || '',
          price: sellPrice,
          cost: carrierItem.price,
          charge_type: 'MRC',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        address: matchingAddress
      };

      console.log('[addCarrierItem] Created quote item:', {
        id: quoteItem.id,
        name: quoteItem.name,
        description: quoteItem.description,
        address_id: quoteItem.address_id,
        address: quoteItem.address ? `${quoteItem.address.city}, ${quoteItem.address.state}` : 'none'
      });

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
