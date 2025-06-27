
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { ClientAddress } from "@/types/clientAddress";

interface AddressSelectorProps {
  addressId: string | null;
  addresses: ClientAddress[];
  onAddressChange: (addressId: string) => void;
}

export const AddressSelector = ({ addressId, addresses, onAddressChange }: AddressSelectorProps) => {
  const formatAddressShort = (address: any) => {
    if (!address) return 'No address';
    return `${address.address_type} - ${address.city}, ${address.state}`;
  };

  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <MapPin className="w-3 h-3" />
      <Select value={addressId || ""} onValueChange={onAddressChange}>
        <SelectTrigger className="text-xs h-6 border-gray-300">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
          {addresses.length === 0 ? (
            <SelectItem value="no-addresses" disabled>No addresses available</SelectItem>
          ) : (
            addresses.map((address) => (
              <SelectItem key={address.id} value={address.id}>
                {formatAddressShort(address)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
