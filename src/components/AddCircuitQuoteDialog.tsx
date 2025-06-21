
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/context/AuthContext";
import { CircuitQuote } from "@/hooks/useCircuitQuotes";
import { supabase } from "@/integrations/supabase/client";

interface AddCircuitQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: Omit<CircuitQuote, "id" | "created_at" | "carriers">) => void;
}

interface AddressData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

const circuitCategoryOptions = [
  "broadband",
  "dedicated fiber", 
  "fixed wireless",
  "4G/5G",
  "ethernet",
  "mpls",
  "sd-wan"
];

export const AddCircuitQuoteDialog = ({ open, onOpenChange, onAddQuote }: AddCircuitQuoteDialogProps) => {
  const { user, isAdmin } = useAuth();
  const [associatedAgentId, setAssociatedAgentId] = useState<string | null>(null);
  const { clients, fetchClients } = useClients(associatedAgentId);
  const [clientId, setClientId] = useState("");
  const [location, setLocation] = useState("");
  const [suite, setSuite] = useState("");
  const [status, setStatus] = useState<'new_pricing' | 'researching' | 'completed' | 'sent_to_customer'>('new_pricing');
  const [staticIp, setStaticIp] = useState(false);
  const [slash29, setSlash29] = useState(false);
  const [mikrotikRequired, setMikrotikRequired] = useState(false);
  const [circuitCategories, setCircuitCategories] = useState<string[]>(["broadband"]);

  // Fetch the associated agent ID for the current user
  React.useEffect(() => {
    const fetchAssociatedAgentId = async () => {
      if (!user || isAdmin) {
        setAssociatedAgentId(null);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('associated_agent_id')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        setAssociatedAgentId(data?.associated_agent_id || null);
      } catch (err) {
        console.error('Exception fetching associated agent:', err);
      }
    };

    fetchAssociatedAgentId();
  }, [user, isAdmin]);

  // Fetch clients when dialog opens or when associatedAgentId changes
  React.useEffect(() => {
    if (open && (isAdmin || associatedAgentId !== null)) {
      fetchClients();
    }
  }, [open, isAdmin, associatedAgentId, fetchClients]);

  const handleAddressSelect = (address: AddressData) => {
    const fullAddress = `${address.street_address}, ${address.city}, ${address.state} ${address.zip_code}`;
    setLocation(fullAddress);
  };

  const handleCircuitCategoryChange = (category: string, checked: boolean) => {
    if (category === "broadband") {
      // Broadband cannot be unchecked
      return;
    }
    
    if (checked) {
      setCircuitCategories(prev => [...prev, category]);
    } else {
      setCircuitCategories(prev => prev.filter(cat => cat !== category));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClient = clients.find(client => client.id === clientId);
    const clientName = selectedClient ? selectedClient.name : "";
    
    if (!clientName || !location) {
      return;
    }
    
    onAddQuote({
      client_name: clientName,
      client_info_id: null,
      location,
      suite,
      status,
      static_ip: staticIp,
      slash_29: slash29,
      mikrotik_required: mikrotikRequired
    });
    
    // Reset form
    setClientId("");
    setLocation("");
    setSuite("");
    setStatus('new_pricing');
    setStaticIp(false);
    setSlash29(false);
    setMikrotikRequired(false);
    setCircuitCategories(["broadband"]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Circuit Quote</DialogTitle>
          <DialogDescription>
            Create a new circuit quote to research carrier pricing and options.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client (Required)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AddressAutocomplete
            label="Location (Required)"
            placeholder="Start typing an address..."
            onAddressSelect={handleAddressSelect}
            initialValue={location}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="suite">Suite</Label>
            <Input
              id="suite"
              value={suite}
              onChange={(e) => setSuite(e.target.value)}
              placeholder="Suite number (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'new_pricing' | 'researching' | 'completed' | 'sent_to_customer')}>
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
            <Label>Circuit Categories</Label>
            <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
              {circuitCategoryOptions.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={circuitCategories.includes(category)}
                    onCheckedChange={(checked) => handleCircuitCategoryChange(category, checked as boolean)}
                    disabled={category === "broadband"}
                  />
                  <Label 
                    htmlFor={`category-${category}`} 
                    className={`text-sm font-normal capitalize ${category === "broadband" ? "text-gray-500" : ""}`}
                  >
                    {category}
                    {category === "broadband" && " (always included)"}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Selected: {circuitCategories.join(", ")}
            </p>
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
              disabled={!clientId || !location}
            >
              Create Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
