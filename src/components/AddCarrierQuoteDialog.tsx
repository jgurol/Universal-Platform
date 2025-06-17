
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CarrierQuote } from "@/components/CircuitQuotesManagement";

interface AddCarrierQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCarrier: (carrier: Omit<CarrierQuote, "id">) => void;
}

const carrierOptions = [
  { value: "frontier", label: "Frontier", color: "bg-green-100 text-green-800" },
  { value: "geolinks", label: "Geolinks", color: "bg-purple-100 text-purple-800" },
  { value: "verizon", label: "Verizon", color: "bg-red-100 text-red-800" },
  { value: "att", label: "AT&T", color: "bg-blue-100 text-blue-800" },
  { value: "spectrum", label: "Spectrum", color: "bg-yellow-100 text-yellow-800" },
  { value: "lumen", label: "Lumen", color: "bg-indigo-100 text-indigo-800" },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-800" }
];

const typeOptions = [
  "Broadband",
  "Fiber",
  "Fixed Wireless",
  "Cable",
  "DSL",
  "Ethernet",
  "T1",
  "Other"
];

export const AddCarrierQuoteDialog = ({ open, onOpenChange, onAddCarrier }: AddCarrierQuoteDialogProps) => {
  const [carrier, setCarrier] = useState("");
  const [type, setType] = useState("");
  const [speed, setSpeed] = useState("");
  const [price, setPrice] = useState("");
  const [term, setTerm] = useState("36 months");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setCarrier("");
    setType("");
    setSpeed("");
    setPrice("");
    setTerm("36 months");
    setNotes("");
  };

  const getCarrierColor = (carrierValue: string) => {
    const option = carrierOptions.find(opt => opt.value === carrierValue);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (carrier && type && speed && price) {
      const selectedCarrier = carrierOptions.find(opt => opt.value === carrier);
      
      onAddCarrier({
        carrier: selectedCarrier?.label || carrier,
        type,
        speed,
        price: parseFloat(price),
        term,
        notes,
        color: getCarrierColor(carrier)
      });
      
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Carrier Quote</DialogTitle>
          <DialogDescription>
            Add pricing information from a carrier for this circuit quote.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier (Required)</Label>
            <Select value={carrier} onValueChange={setCarrier} required>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {carrierOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Connection Type (Required)</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select connection type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
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
              <SelectContent>
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
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Add Carrier Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
