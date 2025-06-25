
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { useClientInfos } from "@/hooks/useClientInfos";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { CircuitQuote } from "@/hooks/useCircuitQuotes";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { DealDetailsDialog } from "@/components/CircuitQuotes/DealDetailsDialog";
import { ClientSelector } from "./ClientSelector";
import { DealSelector } from "./DealSelector";
import { CircuitRequirements } from "./CircuitRequirements";
import { CategorySelector } from "./CategorySelector";
import { useAddCircuitQuoteForm } from "./useAddCircuitQuoteForm";

interface AddCircuitQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: Omit<CircuitQuote, "id" | "created_at" | "carriers" | "categories">, categories: string[]) => Promise<any>;
}

interface AddressData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export const AddCircuitQuoteDialog = ({ open, onOpenChange, onAddQuote }: AddCircuitQuoteDialogProps) => {
  const { user, isAdmin } = useAuth();
  const { associatedAgentId } = useUserProfile();
  const { clientInfos, isLoading: clientsLoading, fetchClientInfos } = useClientInfos();
  const { categories } = useCategories();
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [isDealDetailsOpen, setIsDealDetailsOpen] = useState(false);

  const {
    selectedDealId,
    setSelectedDealId,
    location,
    setLocation,
    suite,
    setSuite,
    staticIp,
    setStaticIp,
    slash29,
    setSlash29,
    dhcp,
    setDhcp,
    mikrotikRequired,
    setMikrotikRequired,
    circuitCategories,
    setCircuitCategories,
    associatedDeals,
    resetForm,
    validateForm
  } = useAddCircuitQuoteForm(clientId, open);

  // Fetch client data when dialog opens
  useEffect(() => {
    if (open && user && associatedAgentId !== undefined) {
      console.log('[AddCircuitQuoteDialog] Dialog opened, fetching client infos');
      fetchClientInfos(user.id, associatedAgentId, isAdmin);
    }
  }, [open, user, associatedAgentId, isAdmin]);

  // Get circuit categories from the categories table where type is "Circuit"
  const circuitCategoryOptions = categories
    .filter(category => category.type === 'Circuit')
    .map(category => category.name);

  // Set default categories based on default_selected flag when dialog opens
  useEffect(() => {
    if (open && categories.length > 0) {
      const defaultCategories = categories
        .filter(category => category.type === 'Circuit' && category.default_selected)
        .map(category => category.name);
      
      if (defaultCategories.length > 0) {
        setCircuitCategories(defaultCategories);
      }
    }
  }, [open, categories]);

  // Get the selected deal for showing details
  const selectedDeal = associatedDeals.find(deal => deal.id === selectedDealId) || null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClient = clientInfos.find(client => client.id === clientId);
    const clientName = selectedClient ? selectedClient.company_name : "";
    
    if (!validateForm(clientName)) {
      return;
    }

    // Validate that the selected client exists and is accessible
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Selected client is not valid or accessible",
        variant: "destructive"
      });
      return;
    }
    
    // Determine the deal_registration_id to save
    const dealRegistrationId = (selectedDealId && selectedDealId !== "no-deal") ? selectedDealId : null;
    
    try {
      await onAddQuote({
        client_name: clientName,
        client_info_id: selectedClient.id,
        deal_registration_id: dealRegistrationId,
        location,
        suite,
        status: 'new_pricing',
        static_ip: staticIp,
        slash_29: slash29,
        dhcp: dhcp,
        mikrotik_required: mikrotikRequired
      }, circuitCategories);
      
      toast({
        title: "Success",
        description: "Circuit quote created successfully!"
      });
      
      // Reset form
      setClientId("");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating circuit quote:', error);
      toast({
        title: "Error",
        description: "Failed to create circuit quote. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (clientsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Circuit Quote</DialogTitle>
            <DialogDescription>
              Loading clients...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            <ClientSelector
              clientInfos={clientInfos}
              clientId={clientId}
              onClientChange={setClientId}
            />

            <DealSelector
              deals={associatedDeals}
              selectedDealId={selectedDealId}
              onDealChange={setSelectedDealId}
              onViewDealDetails={() => setIsDealDetailsOpen(true)}
            />

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

            <CategorySelector
              categories={circuitCategoryOptions}
              selectedCategories={circuitCategories}
              onCategoryChange={handleCircuitCategoryChange}
            />

            <CircuitRequirements
              staticIp={staticIp}
              slash29={slash29}
              dhcp={dhcp}
              mikrotikRequired={mikrotikRequired}
              onStaticIpChange={setStaticIp}
              onSlash29Change={setSlash29}
              onDhcpChange={setDhcp}
              onMikrotikChange={setMikrotikRequired}
            />
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!clientId || !location || clientInfos.length === 0}
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
        dealId={selectedDealId}
      />
    </>
  );
};
