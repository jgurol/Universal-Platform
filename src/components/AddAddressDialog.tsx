

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AddClientAddressData, ClientAddress } from "@/types/clientAddress";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAddress: (address: AddClientAddressData) => Promise<ClientAddress>;
  clientInfoId: string;
}

interface AddressData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export const AddAddressDialog = ({ open, onOpenChange, onAddAddress, clientInfoId }: AddAddressDialogProps) => {
  const [addressType, setAddressType] = useState("billing");
  const [streetAddress, setStreetAddress] = useState("");
  const [streetAddress2, setStreetAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAutocomplete, setUseAutocomplete] = useState(true);

  const handleAddressSelect = (addressData: AddressData) => {
    setStreetAddress(addressData.street_address);
    setCity(addressData.city);
    setState(addressData.state);
    setZipCode(addressData.zip_code);
    setCountry(addressData.country);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const addressData: AddClientAddressData = {
        client_info_id: clientInfoId,
        address_type: addressType,
        street_address: streetAddress,
        street_address_2: streetAddress2 || undefined,
        city,
        state,
        zip_code: zipCode,
        country,
        is_primary: isPrimary
      };

      await onAddAddress(addressData);
      
      // Reset form
      setAddressType("billing");
      setStreetAddress("");
      setStreetAddress2("");
      setCity("");
      setState("");
      setZipCode("");
      setCountry("United States");
      setIsPrimary(false);
      setUseAutocomplete(true);
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding address:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address-type">Address Type</Label>
            <Select value={addressType} onValueChange={setAddressType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="mailing">Mailing</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant={useAutocomplete ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseAutocomplete(true)}
            >
              Address Lookup
            </Button>
            <Button
              type="button"
              variant={!useAutocomplete ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseAutocomplete(false)}
            >
              Manual Entry
            </Button>
          </div>

          {useAutocomplete ? (
            <AddressAutocomplete
              onAddressSelect={handleAddressSelect}
              initialValue=""
              label="Street Address"
              required
            />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="street-address">Street Address</Label>
              <Input
                id="street-address"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="123 Main St"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="street-address-2">Suite/Apt # (Optional)</Label>
            <Input
              id="street-address-2"
              value={streetAddress2}
              onChange={(e) => setStreetAddress2(e.target.value)}
              placeholder="Suite 100, Apt 2B, etc."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
            />
            <Label htmlFor="is-primary">Set as primary address</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Address"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

