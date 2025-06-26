
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

interface AddressInputProps {
  location: string;
  suite: string;
  onLocationChange: (location: string) => void;
  onSuiteChange: (suite: string) => void;
}

interface AddressData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export const AddressInput = ({ 
  location, 
  suite, 
  onLocationChange, 
  onSuiteChange 
}: AddressInputProps) => {
  const handleAddressSelect = (addressData: AddressData) => {
    const fullAddress = `${addressData.street_address}, ${addressData.city}, ${addressData.state} ${addressData.zip_code}`;
    onLocationChange(fullAddress);
  };

  return (
    <div className="space-y-4">
      <AddressAutocomplete
        onAddressSelect={handleAddressSelect}
        initialValue={location}
        placeholder="Start typing the service address..."
        label="Service Address"
        required
      />
      
      <div className="space-y-2">
        <Label htmlFor="suite">Suite/Unit (Optional)</Label>
        <Input
          id="suite"
          value={suite}
          onChange={(e) => onSuiteChange(e.target.value)}
          placeholder="Suite 100, Unit A, etc."
        />
      </div>
    </div>
  );
};
