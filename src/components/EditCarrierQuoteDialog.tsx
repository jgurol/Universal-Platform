
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CarrierQuote } from "@/components/CircuitQuotesManagement";
import { useCarrierOptions } from "@/hooks/useCarrierOptions";

interface EditCarrierQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrier: CarrierQuote;
  onUpdateCarrier: (carrier: CarrierQuote) => void;
}

export const EditCarrierQuoteDialog = ({ open, onOpenChange, carrier, onUpdateCarrier }: EditCarrierQuoteDialogProps) => {
  const [vendorId, setVendorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [speed, setSpeed] = useState("");
  const [price, setPrice] = useState("");
  const [term, setTerm] = useState("");
  const [notes, setNotes] = useState("");

  const { vendors, categories, loading } = useCarrierOptions();

  useEffect(() => {
    if (carrier && vendors.length > 0 && categories.length > 0) {
      // Find the vendor and category IDs based on the current names
      const foundVendor = vendors.find(v => v.name === carrier.carrier);
      const foundCategory = categories.find(c => c.name === carrier.type);
      
      setVendorId(foundVendor?.id || "");
      setCategoryId(foundCategory?.id || "");
      setSpeed(carrier.speed);
      setPrice(carrier.price > 0 ? carrier.price.toString() : "");
      setTerm(carrier.term);
      setNotes(carrier.notes);
    }
  }, [carrier, vendors, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (vendorId && categoryId && speed) {
      const selectedVendor = vendors.find(v => v.id === vendorId);
      const selectedCategory = categories.find(c => c.id === categoryId);
      
      // Use vendor's color or default to blue
      const vendorColor = selectedVendor?.color || '#3B82F6';
      
      onUpdateCarrier({
        ...carrier,
        carrier: selectedVendor?.name || "",
        type: selectedCategory?.name || "",
        speed,
        price: price ? parseFloat(price) : 0,
        term,
        notes,
        color: vendorColor
      });
      
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Carrier Quote</DialogTitle>
          <DialogDescription>
            Update the carrier quote information. Leave price and term blank if waiting for vendor response.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Carrier (Required)</Label>
            <Select value={vendorId} onValueChange={setVendorId} required>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading vendors..." : "Select vendor"} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: vendor.color || '#3B82F6' }}
                      />
                      {vendor.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Circuit Type (Required)</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading types..." : "Select circuit type"} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="speed">Speed (Required)</Label>
            <Input
              id="speed"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              placeholder="e.g., 100x100M, 1Gx1G"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Monthly Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Leave blank if waiting for quote"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Contract Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Leave blank if waiting for quote" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="Month to Month">Month to Month</SelectItem>
                <SelectItem value="12 months">12 months</SelectItem>
                <SelectItem value="24 months">24 months</SelectItem>
                <SelectItem value="36 months">36 months</SelectItem>
                <SelectItem value="60 months">60 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this quote (e.g., includes static IPs, installation fees, etc.)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!vendorId || !categoryId || !speed || loading}
            >
              Update Carrier Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
