
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const carrierColors = [
  { name: "Gray", value: "bg-gray-100 text-gray-800" },
  { name: "Blue", value: "bg-blue-100 text-blue-800" },
  { name: "Green", value: "bg-green-100 text-green-800" },
  { name: "Yellow", value: "bg-yellow-100 text-yellow-800" },
  { name: "Red", value: "bg-red-100 text-red-800" },
  { name: "Purple", value: "bg-purple-100 text-purple-800" },
  { name: "Orange", value: "bg-orange-100 text-orange-800" },
];

export const AddCarrierQuoteDialog = ({ open, onOpenChange, onAddCarrier }: AddCarrierQuoteDialogProps) => {
  const [carrierId, setCarrierId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [speed, setSpeed] = useState("");
  const [price, setPrice] = useState("");
  const [term, setTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("bg-gray-100 text-gray-800");

  const { carriers, circuitTypes, loading } = useCarrierOptions();

  const resetForm = () => {
    setCarrierId("");
    setTypeId("");
    setSpeed("");
    setPrice("");
    setTerm("");
    setNotes("");
    setColor("bg-gray-100 text-gray-800");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (carrierId && typeId && speed && price) {
      const selectedCarrier = carriers.find(c => c.id === carrierId);
      const selectedType = circuitTypes.find(t => t.id === typeId);
      
      onAddCarrier({
        carrier: selectedCarrier?.name || "",
        type: selectedType?.name || "",
        speed,
        price: parseFloat(price),
        term,
        notes,
        color
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
            Add a new carrier quote for this circuit.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Carrier (Required)</Label>
              <Select value={carrierId} onValueChange={setCarrierId} required>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading carriers..." : "Select a carrier"} />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {carriers.map((carrier) => (
                    <SelectItem key={carrier.id} value={carrier.id}>
                      {carrier.name}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="speed">Speed (Required)</Label>
              <Input
                id="speed"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                placeholder="e.g., 100Mbps, 1Gbps"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (Required)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Monthly price"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g., 36 months, 1 year"
            />
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
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this quote"
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
              Add Carrier Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
