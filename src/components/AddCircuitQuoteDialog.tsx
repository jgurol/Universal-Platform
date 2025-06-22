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
import { useCategories } from "@/hooks/useCategories";
import { CircuitQuote } from "@/hooks/useCircuitQuotes";
import { supabase } from "@/integrations/supabase/client";
import { DealRegistration } from "@/services/dealRegistrationService";
import { Info } from "lucide-react";

interface AddCircuitQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: Omit<CircuitQuote, "id" | "created_at" | "carriers" | "categories">, categories: string[]) => void;
}

interface AddressData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

// Deal Details Dialog Component
const DealDetailsDialog = ({ open, onOpenChange, deal }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  deal: DealRegistration | null; 
}) => {
  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deal Details</DialogTitle>
          <DialogDescription>
            Information about the selected deal registration
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Deal Name</Label>
              <p className="text-sm font-medium">{deal.deal_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Deal Value</Label>
              <p className="text-sm font-medium">${deal.deal_value.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Stage</Label>
              <p className="text-sm capitalize">{deal.stage.replace('-', ' ')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Probability</Label>
              <p className="text-sm">{deal.probability}%</p>
            </div>
          </div>
          
          {deal.expected_close_date && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Expected Close Date</Label>
              <p className="text-sm">{new Date(deal.expected_close_date).toLocaleDateString()}</p>
            </div>
          )}
          
          {deal.description && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Description</Label>
              <p className="text-sm">{deal.description}</p>
            </div>
          )}
          
          {deal.notes && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Notes</Label>
              <p className="text-sm">{deal.notes}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AddCircuitQuoteDialog = ({ open, onOpenChange, onAddQuote }: AddCircuitQuoteDialogProps) => {
  const { user, isAdmin } = useAuth();
  const [associatedAgentId, setAssociatedAgentId] = useState<string | null>(null);
  const { clients, fetchClients } = useClients();
  const { categories } = useCategories();
  const [clientId, setClientId] = useState("");
  const [selectedDealId, setSelectedDealId] = useState("");
  const [location, setLocation] = useState("");
  const [suite, setSuite] = useState("");
  const [staticIp, setStaticIp] = useState(false);
  const [slash29, setSlash29] = useState(false);
  const [dhcp, setDhcp] = useState(false);
  const [mikrotikRequired, setMikrotikRequired] = useState(true);
  const [circuitCategories, setCircuitCategories] = useState<string[]>([]);
  const [associatedDeals, setAssociatedDeals] = useState<DealRegistration[]>([]);
  const [isDealDetailsOpen, setIsDealDetailsOpen] = useState(false);

  // Get circuit categories from the categories table where type is "Circuit"
  const circuitCategoryOptions = categories
    .filter(category => category.type === 'Circuit')
    .map(category => category.name);

  // Set default categories based on default_selected flag when dialog opens
  React.useEffect(() => {
    if (open && categories.length > 0) {
      const defaultCategories = categories
        .filter(category => category.type === 'Circuit' && category.default_selected)
        .map(category => category.name);
      
      if (defaultCategories.length > 0) {
        setCircuitCategories(defaultCategories);
      }
    }
  }, [open, categories]);

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

  // Fetch deals associated with the selected client
  React.useEffect(() => {
    const fetchAssociatedDeals = async () => {
      if (!clientId) {
        setAssociatedDeals([]);
        setSelectedDealId("");
        return;
      }

      try {
        // Get client_info_id from the selected client
        const selectedClient = clients.find(client => client.id === clientId);
        if (!selectedClient) {
          setAssociatedDeals([]);
          setSelectedDealId("");
          return;
        }

        const { data: deals, error } = await supabase
          .from('deal_registrations')
          .select('*')
          .eq('client_info_id', selectedClient.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching associated deals:', error);
          setAssociatedDeals([]);
        } else {
          setAssociatedDeals(deals || []);
        }
      } catch (error) {
        console.error('Error fetching associated deals:', error);
        setAssociatedDeals([]);
      }
    };

    fetchAssociatedDeals();
  }, [clientId, clients]);

  // Get the selected deal for showing details
  const selectedDeal = associatedDeals.find(deal => deal.id === selectedDealId) || null;

  // Check if a valid deal is selected (not empty and not "no-deal")
  const isDealSelected = selectedDealId && selectedDealId !== "" && selectedDealId !== "no-deal";

  // Debug logging for deal button visibility
  console.log('Deal button debug:', {
    selectedDealId,
    isDealSelected,
    selectedDeal: selectedDeal ? selectedDeal.deal_name : null,
    associatedDealsCount: associatedDeals.length
  });

  const handleAddressSelect = (address: AddressData) => {
    const fullAddress = `${address.street_address}, ${address.city}, ${address.state} ${address.zip_code}`;
    setLocation(fullAddress);
  };

  const handleCircuitCategoryChange = (category: string, checked: boolean) => {
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
    
    // Determine the deal_registration_id to save
    const dealRegistrationId = (selectedDealId && selectedDealId !== "no-deal") ? selectedDealId : null;
    
    onAddQuote({
      client_name: clientName,
      client_info_id: selectedClient?.id || null,
      deal_registration_id: dealRegistrationId, // Save the selected deal ID
      location,
      suite,
      status: 'new_pricing',
      static_ip: staticIp,
      slash_29: slash29,
      dhcp: dhcp,
      mikrotik_required: mikrotikRequired
    }, circuitCategories);
    
    // Reset form
    setClientId("");
    setSelectedDealId("");
    setLocation("");
    setSuite("");
    setStaticIp(false);
    setSlash29(false);
    setDhcp(false);
    setMikrotikRequired(true);
    setCircuitCategories([]);
    setAssociatedDeals([]);
    onOpenChange(false);
  };

  return (
    <>
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

            <div className="space-y-2">
              <Label htmlFor="dealRegistration">Deal Registration (Optional)</Label>
              <div className="flex gap-2">
                <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a deal registration (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="no-deal">No specific deal</SelectItem>
                    {associatedDeals.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{deal.deal_name}</span>
                          <span className="text-sm text-gray-500">
                            ${deal.deal_value.toLocaleString()} - {deal.stage}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {isDealSelected && selectedDeal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      console.log('Opening deal details for:', selectedDeal.deal_name);
                      setIsDealDetailsOpen(true);
                    }}
                    title="View deal details"
                    className="shrink-0"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                )}
              </div>
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

            <div className="space-y-4">
              <Label>Circuit Categories</Label>
              <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                {circuitCategoryOptions.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={circuitCategories.includes(category)}
                      onCheckedChange={(checked) => handleCircuitCategoryChange(category, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`category-${category}`} 
                      className="text-sm font-normal capitalize"
                    >
                      {category}
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
                    /30 Static IP
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="slash-29"
                    checked={slash29}
                    onCheckedChange={(checked) => setSlash29(checked as boolean)}
                  />
                  <Label htmlFor="slash-29" className="text-sm font-normal">
                    /29 Static IP
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dhcp"
                    checked={dhcp}
                    onCheckedChange={(checked) => setDhcp(checked as boolean)}
                  />
                  <Label htmlFor="dhcp" className="text-sm font-normal">
                    DHCP (No Static IP)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mikrotik-required"
                    checked={mikrotikRequired}
                    onCheckedChange={(checked) => setMikrotikRequired(checked as boolean)}
                  />
                  <Label htmlFor="mikrotik-required" className="text-sm font-normal">
                    Router Required (Mikrotik)
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

      <DealDetailsDialog
        open={isDealDetailsOpen}
        onOpenChange={setIsDealDetailsOpen}
        deal={selectedDeal}
      />
    </>
  );
};
