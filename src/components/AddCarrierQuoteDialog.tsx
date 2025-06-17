
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCarrierOptions } from "@/hooks/useCarrierOptions";

interface AddCarrierQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCarrier: (carrier: {
    carrier: string;
    type: string;
    speed: string;
    price: number;
    term: string;
    notes: string;
    color: string;
  }) => void;
}

export const AddCarrierQuoteDialog = ({ open, onOpenChange, onAddCarrier }: AddCarrierQuoteDialogProps) => {
  const [vendorId, setVendorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [speed, setSpeed] = useState("");
  const [price, setPrice] = useState("");
  const [term, setTerm] = useState("");
  const [notes, setNotes] = useState("");

  const { vendors, categories, loading } = useCarrierOptions();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (vendorId && categoryId && speed && price) {
      const selectedVendor = vendors.find(v => v.id === vendorId);
      const selectedCategory = categories.find(c => c.id === categoryId);
      
      // Use vendor's color or default to blue
      const vendorColor = selectedVendor?.color || '#3B82F6';
      
      onAddCarrier({
        carrier: selectedVendor?.name || "",
        type: selectedCategory?.name || "",
        speed,
        price: parseFloat(price),
        term,
        notes,
        color: vendorColor
      });
      
      // Reset form
      setVendorId("");
      setCategoryId("");
      setSpeed("");
      setPrice("");
      setTerm("");
      setNotes("");
      
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Carrier Quote</DialogTitle>
          <DialogDescription>
            Add a new carrier quote for comparison.
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
            <Label htmlFor="price">Monthly Price (Required)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter monthly price"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Contract Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
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
              disabled={!vendorId || !categoryId || !speed || !price || loading}
            >
              Add Carrier Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
