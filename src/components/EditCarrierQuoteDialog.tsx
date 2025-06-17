
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

const carrierColors = [
  { name: "Gray", value: "bg-gray-100 text-gray-800" },
  { name: "Blue", value: "bg-blue-100 text-blue-800" },
  { name: "Green", value: "bg-green-100 text-green-800" },
  { name: "Yellow", value: "bg-yellow-100 text-yellow-800" },
  { name: "Red", value: "bg-red-100 text-red-800" },
  { name: "Purple", value: "bg-purple-100 text-purple-800" },
  { name: "Orange", value: "bg-orange-100 text-orange-800" },
];

export const EditCarrierQuoteDialog = ({ open, onOpenChange, carrier, onUpdateCarrier }: EditCarrierQuoteDialogProps) => {
  const [carrierId, setCarrierId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [speed, setSpeed] = useState("");
  const [price, setPrice] = useState("");
  const [term, setTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("bg-gray-100 text-gray-800");

  const { carriers, circuitTypes, loading } = useCarrierOptions();

  useEffect(() => {
    if (carrier && carriers.length > 0 && circuitTypes.length > 0) {
      // Find the carrier and type IDs based on the current names
      const foundCarrier = carriers.find(c => c.name === carrier.carrier);
      const foundType = circuitTypes.find(t => t.name === carrier.type);
      
      setCarrierId(foundCarrier?.id || "");
      setTypeId(foundType?.id || "");
      setSpeed(carrier.speed);
      setPrice(carrier.price.toString());
      setTerm(carrier.term);
      setNotes(carrier.notes);
      setColor(carrier.color);
    }
  }, [carrier, carriers, circuitTypes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (carrierId && typeId && speed && price) {
      const selectedCarrier = carriers.find(c => c.id === carrierId);
      const selectedType = circuitTypes.find(t => t.id === typeId);
      
      onUpdateCarrier({
        ...carrier,
        carrier: selectedCarrier?.name || "",
        type: selectedType?.name || "",
        speed,
        price: parseFloat(price),
        term,
        notes,
        color
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
            Update the carrier quote information.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier (Required)</Label>
            <Select value={carrierId} onValueChange={setCarrierId} required>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading carriers..." : "Select carrier"} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {carriers.map((carrierOption) => (
                  <SelectItem key={carrierOption.id} value={carrierOption.id}>
                    {carrierOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Circuit Type (Required)</Label>
            <Select value={typeId} onValueChange={setTypeId} required>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading types..." : "Select circuit type"} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {circuitTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
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
            <Label htmlFor="color">Badge Color</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {carrierColors.map((colorOption) => (
                  <SelectItem key={colorOption.value} value={colorOption.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${colorOption.value}`}></div>
                      {colorOption.name}
                    </div>
                  </SelectItem>
                ))}
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
              disabled={!carrierId || !typeId || !speed || !price || loading}
            >
              Update Carrier Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
