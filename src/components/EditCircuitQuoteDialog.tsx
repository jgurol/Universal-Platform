
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CircuitQuote } from "@/hooks/useCircuitQuotes";

interface EditCircuitQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: CircuitQuote;
  onUpdateQuote: (quote: CircuitQuote) => void;
}

export const EditCircuitQuoteDialog = ({ open, onOpenChange, quote, onUpdateQuote }: EditCircuitQuoteDialogProps) => {
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  const [suite, setSuite] = useState("");
  const [status, setStatus] = useState("");
  const [staticIp, setStaticIp] = useState(false);
  const [slash29, setSlash29] = useState(false);
  const [mikrotikRequired, setMikrotikRequired] = useState(false);

  useEffect(() => {
    if (quote) {
      setClientName(quote.client_name);
      setLocation(quote.location);
      setSuite(quote.suite || "");
      setStatus(quote.status);
      setStaticIp(quote.static_ip || false);
      setSlash29(quote.slash_29 || false);
      setMikrotikRequired(quote.mikrotik_required || false);
    }
  }, [quote]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onUpdateQuote({
      ...quote,
      client_name: clientName,
      location,
      suite,
      status: status as 'new_pricing' | 'researching' | 'completed' | 'sent_to_customer',
      static_ip: staticIp,
      slash_29: slash29,
      mikrotik_required: mikrotikRequired
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Circuit Quote</DialogTitle>
          <DialogDescription>
            Update the circuit quote details and requirements.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Client Name (Required)</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Required)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suite">Suite</Label>
            <Input
              id="suite"
              value={suite}
              onChange={(e) => setSuite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="new_pricing">New Pricing</SelectItem>
                <SelectItem value="researching">Researching</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="sent_to_customer">Sent to Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Quote Requirements</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="static-ip"
                  checked={staticIp}
                  onCheckedChange={(checked) => setStaticIp(checked as boolean)}
                />
                <Label htmlFor="static-ip" className="text-sm font-normal">
                  /30 IP Required
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="slash-29"
                  checked={slash29}
                  onCheckedChange={(checked) => setSlash29(checked as boolean)}
                />
                <Label htmlFor="slash-29" className="text-sm font-normal">
                  /29 IP Required
                </Label>
              </div>

              <div className="flex items-center space-x-2 col-span-2">
                <Checkbox
                  id="mikrotik-required"
                  checked={mikrotikRequired}
                  onCheckedChange={(checked) => setMikrotikRequired(checked as boolean)}
                />
                <Label htmlFor="mikrotik-required" className="text-sm font-normal">
                  Mikrotik Required
                </Label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!clientName || !location}
            >
              Update Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
