import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ClientAddress, UpdateClientAddressData } from "@/types/clientAddress";
import { validateAddress, formatValidationErrors } from "@/utils/addressValidation";

interface EditAddressDialogProps {
  address: ClientAddress;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateAddress: (address: UpdateClientAddressData) => Promise<void>;
}

export const EditAddressDialog = ({ address, open, onOpenChange, onUpdateAddress }: EditAddressDialogProps) => {
  const [addressType, setAddressType] = useState(address.address_type);
  const [streetAddress, setStreetAddress] = useState(address.street_address);
  const [city, setCity] = useState(address.city);
  const [state, setState] = useState(address.state);
  const [zipCode, setZipCode] = useState(address.zip_code);
  const [country, setCountry] = useState(address.country);
  const [isPrimary, setIsPrimary] = useState(address.is_primary);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string | null>(null);

  useEffect(() => {
    setAddressType(address.address_type);
    setStreetAddress(address.street_address);
    setCity(address.city);
    setState(address.state);
    setZipCode(address.zip_code);
    setCountry(address.country);
    setIsPrimary(address.is_primary);
    setValidationErrors(null);
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors(null);
    
    // Validate the address
    const errors = validateAddress({
      street_address: streetAddress,
      city,
      state,
      zip_code: zipCode,
      country
    });
    
    if (errors.length > 0) {
      setValidationErrors(formatValidationErrors(errors));
      return;
    }

    if (streetAddress && city && state && zipCode) {
      setIsSubmitting(true);
      try {
        await onUpdateAddress({
          id: address.id,
          client_info_id: address.client_info_id,
          address_type: addressType,
          street_address: streetAddress,
          city,
          state,
          zip_code: zipCode,
          country,
          is_primary: isPrimary
        });
        onOpenChange(false);
      } catch (err) {
        console.error('Error updating address:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Address</DialogTitle>
          <DialogDescription>
            Update the address information.
          </DialogDescription>
        </DialogHeader>
        
        {validationErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {validationErrors}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editAddressType">Address Type</Label>
            <Select value={addressType} onValueChange={setAddressType}>
              <SelectTrigger id="editAddressType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="mailing">Mailing</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editStreetAddress" className="required">Street Address</Label>
            <Input
              id="editStreetAddress"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Enter street address"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editCity" className="required">City</Label>
              <Input
                id="editCity"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editState" className="required">State</Label>
              <Input
                id="editState"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter state"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editZipCode" className="required">ZIP Code</Label>
              <Input
                id="editZipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter ZIP code"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editCountry">Country</Label>
              <Input
                id="editCountry"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter country"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="editIsPrimary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
            />
            <Label htmlFor="editIsPrimary">Set as primary address</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !streetAddress || !city || !state || !zipCode}
            >
              {isSubmitting ? 'Updating...' : 'Update Address'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
