
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClientAddresses } from "@/hooks/useClientAddresses";

interface AddressSelectorProps {
  clientInfoId: string | null;
  selectedAddressId?: string;
  onAddressChange: (addressId: string | null, customAddress?: string) => void;
  label: string;
  autoSelectPrimary?: boolean;
}

export const AddressSelector = ({ 
  clientInfoId, 
  selectedAddressId, 
  onAddressChange, 
  label,
  autoSelectPrimary = false
}: AddressSelectorProps) => {
  const { addresses } = useClientAddresses(clientInfoId);
  const [useCustom, setUseCustom] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  // Sync internal state with external props
  useEffect(() => {
    if (selectedAddressId && selectedAddressId !== internalSelectedId) {
      setInternalSelectedId(selectedAddressId);
      setUseCustom(false);
      console.log('AddressSelector - Synced with external selectedAddressId:', { 
        label, 
        selectedAddressId,
        internalSelectedId 
      });
    }
  }, [selectedAddressId, internalSelectedId, label]);

  // Auto-select primary address only when explicitly requested AND when addresses load
  useEffect(() => {
    if (autoSelectPrimary && addresses.length > 0 && !internalSelectedId && !useCustom && !selectedAddressId) {
      const primaryAddress = addresses.find(addr => addr.is_primary);
      if (primaryAddress) {
        const formattedAddress = `${primaryAddress.street_address}${primaryAddress.street_address_2 ? `, ${primaryAddress.street_address_2}` : ''}, ${primaryAddress.city}, ${primaryAddress.state} ${primaryAddress.zip_code}`;
        setInternalSelectedId(primaryAddress.id);
        onAddressChange(primaryAddress.id, formattedAddress);
        console.log('AddressSelector - Auto-selected primary address:', { 
          label, 
          addressId: primaryAddress.id, 
          address: formattedAddress 
        });
      }
    }
  }, [addresses, autoSelectPrimary, internalSelectedId, useCustom, selectedAddressId, onAddressChange, label]);

  const handleAddressSelect = (addressId: string) => {
    console.log('AddressSelector - Address selected:', { label, addressId });
    
    if (addressId === "custom") {
      setUseCustom(true);
      setInternalSelectedId(null);
      onAddressChange(null, "");
    } else if (addressId === "none") {
      setUseCustom(false);
      setCustomAddress("");
      setInternalSelectedId(null);
      onAddressChange(null, "");
      console.log('AddressSelector - Cleared address:', { label });
    } else {
      setUseCustom(false);
      setInternalSelectedId(addressId);
      const selectedAddress = addresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        const formattedAddress = `${selectedAddress.street_address}${selectedAddress.street_address_2 ? `, ${selectedAddress.street_address_2}` : ''}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zip_code}`;
        onAddressChange(addressId, formattedAddress);
        console.log('AddressSelector - Selected address:', { 
          label, 
          addressId, 
          address: formattedAddress,
          internalSelectedId: addressId
        });
      }
    }
  };

  const handleCustomAddressChange = (value: string) => {
    setCustomAddress(value);
    onAddressChange(null, value);
    console.log('AddressSelector - Custom address changed:', { label, customAddress: value });
  };

  // Get the current display value for the select
  const getSelectValue = () => {
    if (useCustom) return "custom";
    
    // Use the internal selected ID or fall back to the prop
    const currentSelectedId = internalSelectedId || selectedAddressId;
    
    if (currentSelectedId && addresses.find(addr => addr.id === currentSelectedId)) {
      console.log('AddressSelector - Returning select value:', { 
        label, 
        currentSelectedId, 
        internalSelectedId, 
        selectedAddressId 
      });
      return currentSelectedId;
    }
    
    console.log('AddressSelector - No address selected, returning "none":', { 
      label, 
      currentSelectedId, 
      addressesCount: addresses.length 
    });
    return "none";
  };

  if (!clientInfoId) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="text-sm text-gray-500">Select a client first</div>
      </div>
    );
  }

  const selectValue = getSelectValue();
  console.log('AddressSelector - Rendering with value:', { label, selectValue, addresses: addresses.length });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!useCustom ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setUseCustom(false);
            setCustomAddress("");
            if (!internalSelectedId && !selectedAddressId) {
              onAddressChange(null, "");
            }
          }}
        >
          Use Existing Address
        </Button>
        <Button
          type="button"
          variant={useCustom ? "default" : "outline"}
          size="sm"
          onClick={() => handleAddressSelect("custom")}
        >
          Enter Custom Address
        </Button>
      </div>

      {!useCustom ? (
        <Select 
          value={selectValue} 
          onValueChange={handleAddressSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- No Address --</SelectItem>
            {addresses.map((address) => (
              <SelectItem key={address.id} value={address.id}>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {address.address_type} {address.is_primary && "(Primary)"}
                  </span>
                  <span className="text-sm text-gray-600">
                    {address.street_address}{address.street_address_2 && `, ${address.street_address_2}`}, {address.city}, {address.state} {address.zip_code}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Textarea
          value={customAddress}
          onChange={(e) => handleCustomAddressChange(e.target.value)}
          placeholder={`Enter custom ${label.toLowerCase()}`}
          rows={3}
        />
      )}
    </div>
  );
};
