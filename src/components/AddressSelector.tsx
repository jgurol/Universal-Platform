
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientAddress } from "@/types/clientAddress";
import { useClientAddresses } from "@/hooks/useClientAddresses";

interface AddressSelectorProps {
  clientInfoId: string | null;
  selectedAddressId?: string;
  onAddressChange: (addressId: string | null, customAddress?: string) => void;
  label?: string;
}

export const AddressSelector = ({ 
  clientInfoId, 
  selectedAddressId, 
  onAddressChange,
  label = "Address"
}: AddressSelectorProps) => {
  const { addresses, isLoading } = useClientAddresses(clientInfoId);
  const [addressMode, setAddressMode] = useState<'existing' | 'custom'>('existing');
  const [customAddress, setCustomAddress] = useState('');

  // Find the primary/billing address on load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const primaryAddress = addresses.find(addr => addr.is_primary) || addresses[0];
      onAddressChange(primaryAddress.id);
    }
  }, [addresses, selectedAddressId, onAddressChange]);

  const handleAddressModeChange = (mode: 'existing' | 'custom') => {
    setAddressMode(mode);
    if (mode === 'existing') {
      const primaryAddress = addresses.find(addr => addr.is_primary) || addresses[0];
      if (primaryAddress) {
        onAddressChange(primaryAddress.id);
      }
    } else {
      onAddressChange(null, customAddress);
    }
  };

  const handleExistingAddressChange = (addressId: string) => {
    onAddressChange(addressId);
  };

  const handleCustomAddressChange = (value: string) => {
    setCustomAddress(value);
    onAddressChange(null, value);
  };

  if (!clientInfoId) {
    return null;
  }

  const formatAddress = (address: ClientAddress) => {
    return `${address.street_address}, ${address.city}, ${address.state} ${address.zip_code}`;
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={addressMode === 'existing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleAddressModeChange('existing')}
          disabled={isLoading || addresses.length === 0}
        >
          Use Existing Address
        </Button>
        <Button
          type="button"
          variant={addressMode === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleAddressModeChange('custom')}
        >
          Enter Custom Address
        </Button>
      </div>

      {addressMode === 'existing' ? (
        <Select value={selectedAddressId || ''} onValueChange={handleExistingAddressChange}>
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? "Loading addresses..." : "Select an address"} />
          </SelectTrigger>
          <SelectContent>
            {addresses.map((address) => (
              <SelectItem key={address.id} value={address.id}>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {address.address_type} {address.is_primary && '(Primary)'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatAddress(address)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={customAddress}
          onChange={(e) => handleCustomAddressChange(e.target.value)}
          placeholder="Enter custom address..."
          className="min-h-[60px]"
        />
      )}

      {addresses.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">
          No addresses found for this client. You can enter a custom address above.
        </p>
      )}
    </div>
  );
};
