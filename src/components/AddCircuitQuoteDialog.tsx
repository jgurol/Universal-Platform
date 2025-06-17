import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface AddCircuitQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: any) => void;
}

interface ClientOption {
  id: string;
  company_name: string;
  contact_name: string | null;
}

interface AddressData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export const AddCircuitQuoteDialog = ({ open, onOpenChange, onAddQuote }: AddCircuitQuoteDialogProps) => {
  const [clientId, setClientId] = useState("");
  const [location, setLocation] = useState("");
  const [suite, setSuite] = useState("");
  const [status, setStatus] = useState<"new_pricing" | "researching" | "completed" | "ready_for_review" | "sent_to_customer">("new_pricing");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [validatedAddress, setValidatedAddress] = useState<AddressData | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    if (!user) return;
    
    setIsLoadingClients(true);
    try {
      const { data: clientInfoData, error: clientInfoError } = await supabase
        .from('client_info')
        .select('id, company_name, contact_name')
        .order('company_name', { ascending: true });

      if (clientInfoError) {
        console.error('Error fetching client info:', clientInfoError);
        return;
      }

      setClients(clientInfoData || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleAddressSelect = (address: AddressData) => {
    setValidatedAddress(address);
    // Format the address for display
    const formattedLocation = `${address.city}, ${address.state}`;
    setLocation(formattedLocation);
  };

  const resetForm = () => {
    setClientId("");
    setLocation("");
    setSuite("");
    setStatus("new_pricing");
    setValidatedAddress(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (clientId && location && validatedAddress) {
      const selectedClient = clients.find(c => c.id === clientId);
      const clientName = selectedClient ? 
        (selectedClient.company_name || selectedClient.contact_name) : 
        "Unknown Client";

      onAddQuote({
        client_info_id: clientId,
        client_name: clientName,
        location,
        suite,
        status
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
            <Label htmlFor="client">Client (Required)</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name || client.contact_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <AddressAutocomplete
              label="Location (Required)"
              placeholder="Start typing a city and state..."
              onAddressSelect={handleAddressSelect}
              required
            />
            {!validatedAddress && location && (
              <p className="text-sm text-orange-600">
                Please select a valid location from the dropdown suggestions.
              </p>
            )}
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
            <Select value={status} onValueChange={(value: "new_pricing" | "researching" | "completed" | "ready_for_review" | "sent_to_customer") => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="new_pricing">New Pricing</SelectItem>
                <SelectItem value="researching">Researching</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="ready_for_review">Ready for Review</SelectItem>
                <SelectItem value="sent_to_customer">Sent to Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!clientId || !location || !validatedAddress}
            >
              Create Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
