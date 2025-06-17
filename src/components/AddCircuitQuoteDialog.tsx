
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircuitQuote } from "@/components/CircuitQuotesManagement";

interface AddCircuitQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: Omit<CircuitQuote, "id">) => void;
}

export const AddCircuitQuoteDialog = ({ open, onOpenChange, onAddQuote }: AddCircuitQuoteDialogProps) => {
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [suite, setSuite] = useState("");
  const [status, setStatus] = useState<"researching" | "quoted" | "published">("researching");

  const resetForm = () => {
    setClient("");
    setLocation("");
    setSuite("");
    setStatus("researching");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (client && location) {
      onAddQuote({
        client,
        location,
        suite,
        creationDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        status,
        carriers: []
      });
      
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Circuit Quote</DialogTitle>
          <DialogDescription>
            Create a new circuit quote to research carrier pricing.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client Name (Required)</Label>
            <Input
              id="client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Enter client name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Required)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location (e.g., City, State)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suite">Suite/Unit</Label>
            <Input
              id="suite"
              value={suite}
              onChange={(e) => setSuite(e.target.value)}
              placeholder="Enter suite or unit number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: "researching" | "quoted" | "published") => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="researching">Researching</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Create Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
