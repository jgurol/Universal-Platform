import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AddClientAddressData } from "@/types/clientAddress";
import { validateAddress, formatValidationErrors } from "@/utils/addressValidation";

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAddress: (address: AddClientAddressData) => Promise<void>;
  clientInfoId: string;
}

export const AddAddressDialog = ({ open, onOpenChange, onAddAddress, clientInfoId }: AddAddressDialogProps) => {
  const [addressType, setAddressType] = useState("billing");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("United States");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string | null>(null);

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
        await onAddAddress({
          client_info_id: clientInfoId,
          address_type: addressType,
          street_address: streetAddress,
          city,
          state,
          zip_code: zipCode,
          country,
          is_primary: isPrimary
        });
        resetForm();
        onOpenChange(false);
      } catch (err) {
        console.error('Error submitting address:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = () => {
    setAddressType("billing");
    setStreetAddress("");
    setCity("");
    setState("");
    setZipCode("");
    setCountry("United States");
    setIsPrimary(false);
    setValidationErrors(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
          <DialogDescription>
            Add a new address for this client.
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
            <Label htmlFor="addressType">Address Type</Label>
            <Select value={addressType} onValueChange={setAddressType}>
              <SelectTrigger id="addressType">
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
            <Label htmlFor="streetAddress" className="required">Street Address</Label>
            <Input
              id="streetAddress"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Enter street address"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="required">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state" className="required">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter state"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="required">ZIP Code</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter ZIP code"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Enter country"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPrimary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
            />
            <Label htmlFor="isPrimary">Set as primary address</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onOpenChange(false);
            }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !streetAddress || !city || !state || !zipCode}
            >
              {isSubmitting ? 'Adding...' : 'Add Address'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
