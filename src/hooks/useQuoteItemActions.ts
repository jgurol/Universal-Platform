
import { useState } from "react";
import { QuoteItemData } from "@/types/quoteItems";
import { useItems } from "@/hooks/useItems";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { useCarrierQuoteItems } from "@/hooks/useCarrierQuoteItems";
import { parseLocationToAddress } from "@/utils/addressParser";

export const useQuoteItemActions = (clientInfoId?: string) => {
  const { items: availableItems, isLoading } = useItems();
  const { addresses, addAddress } = useClientAddresses(clientInfoId || null);
  const { carrierQuoteItems } = useCarrierQuoteItems(clientInfoId || null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isAddingCarrierItem, setIsAddingCarrierItem] = useState(false);

  const addCarrierItem = async (carrierQuoteId: string, items: QuoteItemData[], onItemsChange: (items: QuoteItemData[]) => void) => {
    if (!clientInfoId) return;
    
    setIsAddingCarrierItem(true);
    
    try {
      const carrierItem = carrierQuoteItems.find(item => item.id === carrierQuoteId);
      
      if (carrierItem) {
        console.log('[useQuoteItemActions] Processing carrier item:', carrierItem);
        
        // Parse the location into address components
        const parsedAddress = parseLocationToAddress(carrierItem.location);
        console.log('[useQuoteItemActions] Parsed address from location:', parsedAddress);
        
        // Look for an existing address that matches the carrier quote location
        let matchingAddress = addresses.find(addr => {
          const addressString = `${addr.street_address}${addr.street_address_2 ? `, ${addr.street_address_2}` : ''}, ${addr.city}, ${addr.state} ${addr.zip_code}`;
          return addressString.toLowerCase().includes(carrierItem.location.toLowerCase()) ||
                 carrierItem.location.toLowerCase().includes(addressString.toLowerCase()) ||
                 (addr.city.toLowerCase() === parsedAddress.city.toLowerCase() && 
                  addr.state.toLowerCase() === parsedAddress.state.toLowerCase());
        });

        // If no matching address exists, create one specifically for this carrier quote location
        if (!matchingAddress && carrierItem.location.trim()) {
          try {
            const newAddressData = {
              client_info_id: clientInfoId,
              address_type: 'service',
              street_address: parsedAddress.street_address || carrierItem.location.split(',')[0] || carrierItem.location,
              city: parsedAddress.city,
              state: parsedAddress.state,
              zip_code: parsedAddress.zip_code,
              country: 'United States',
              is_primary: false // Don't make carrier locations primary
            };

            console.log('[useQuoteItemActions] Creating new address for carrier location:', newAddressData);
            const newAddress = await addAddress(newAddressData);
            matchingAddress = newAddress;
            console.log('[useQuoteItemActions] Created address for carrier location:', newAddress);
          } catch (error) {
            console.error('Error creating address for carrier location:', error);
            // Continue without creating address if it fails
          }
        }

        console.log('[useQuoteItemActions] Final matching address for carrier item:', matchingAddress);

        // Create a temporary quote item for the carrier quote
        const descriptionParts = [];
        if (carrierItem.notes) {
          descriptionParts.push(`Notes: ${carrierItem.notes}`);
        }

        const quoteItem: QuoteItemData = {
          id: `temp-carrier-${Date.now()}`,
          item_id: `carrier-${carrierItem.id}`,
          quantity: 1,
          unit_price: 0,
          cost_override: carrierItem.price,
          total_price: 0,
          charge_type: 'MRC',
          address_id: matchingAddress?.id,
          name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
          description: descriptionParts.join(' | '),
          item: {
            id: `carrier-${carrierItem.id}`,
            user_id: '',
            name: `${carrierItem.carrier} - ${carrierItem.type} - ${carrierItem.speed}`,
            description: descriptionParts.join(' | '),
            price: 0,
            cost: carrierItem.price,
            charge_type: 'MRC',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          address: matchingAddress // This should be the address that matches the carrier location
        };

        console.log('[useQuoteItemActions] Adding carrier item with specific location address:', {
          itemName: quoteItem.name,
          carrierLocation: carrierItem.location,
          addressId: quoteItem.address_id,
          addressDetails: quoteItem.address
        });

        // Add to items list
        const newItems = [...items, quoteItem];
        onItemsChange(newItems);
        setSelectedItemId("");
      }
    } catch (error) {
      console.error('[useQuoteItemActions] Error adding carrier item:', error);
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
