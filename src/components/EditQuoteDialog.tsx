
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { QuoteDetailsSection } from "@/components/QuoteDetailsSection";
import { AddressSelector } from "@/components/AddressSelector";
import { useQuoteForm } from "@/hooks/useQuoteForm";
import { useQuoteItems } from "@/hooks/useQuoteItems";
import { updateQuoteItems, calculateTotalsByChargeType } from "@/services/quoteItemsService";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

interface EditQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateQuote: (quote: Quote) => void;
  clients: Client[];
  clientInfos: ClientInfo[];
}

export const EditQuoteDialog = ({ 
  quote, 
  open, 
  onOpenChange, 
  onUpdateQuote, 
  clients, 
  clientInfos 
}: EditQuoteDialogProps) => {
  const {
    clientId,
    setClientId,
    clientInfoId,
    setClientInfoId,
    date,
    setDate,
    description,
    setDescription,
    quoteNumber,
    setQuoteNumber,
    status,
    setStatus,
    expiresAt,
    setExpiresAt,
    notes,
    setNotes,
    commissionOverride,
    setCommissionOverride
  } = useQuoteForm(quote, open);

  const { quoteItems, setQuoteItems } = useQuoteItems(quote, open);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [selectedServiceAddressId, setSelectedServiceAddressId] = useState<string | null>(null);
  const [serviceAddress, setServiceAddress] = useState<string>("");

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const { user } = useAuth();

  // Initialize addresses from quote - don't auto-populate service address
  useEffect(() => {
    if (quote && open) {
      setBillingAddress(quote.billingAddress || "");
      // Only set service address if it actually exists in the quote
      setServiceAddress(quote.serviceAddress || "");
      console.log('EditQuoteDialog - Initialized addresses (no auto-population):', { 
        billing: quote.billingAddress, 
        service: quote.serviceAddress 
      });
    }
  }, [quote, open]);

  // Load templates when dialog opens
  useEffect(() => {
    const fetchTemplates = async () => {
      if (open && user) {
        try {
          const { data, error } = await supabase
            .from('quote_templates')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

          if (error) throw error;
          setTemplates(data || []);
        } catch (error) {
          console.error('Error loading templates:', error);
        }
      }
    };

    fetchTemplates();
  }, [open, user]);

  // Initialize template selection from quote
  useEffect(() => {
    if (quote && open) {
      setSelectedTemplateId((quote as any).templateId || "none");
    }
  }, [quote, open]);

  const handleBillingAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('EditQuoteDialog - Billing address changed:', { addressId, customAddr });
    setSelectedBillingAddressId(addressId);
    if (customAddr !== undefined) {
      setBillingAddress(customAddr);
    }
  };

  const handleServiceAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('EditQuoteDialog - Service address changed:', { addressId, customAddr });
    setSelectedServiceAddressId(addressId);
    if (customAddr !== undefined) {
      setServiceAddress(customAddr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quote && clientId && date) {
      const selectedClient = clients.find(client => client.id === clientId);
      const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? clientInfos.find(info => info.id === clientInfoId) : null;
      
      if (selectedClient) {
        const { totalAmount } = calculateTotalsByChargeType(quoteItems);
        
        console.log('[EditQuoteDialog] Saving quote items before updating quote:', quoteItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          address_id: item.address_id
        })));
        
        // Update quote items in database with address information and custom descriptions
        await updateQuoteItems(quote.id, quoteItems);

        console.log('EditQuoteDialog - Updating quote with addresses (no auto-population):', { 
          billing: billingAddress, 
          service: serviceAddress 
        });

        onUpdateQuote({
          ...quote,
          clientId,
          clientName: selectedClient.name,
          companyName: selectedClient.companyName || selectedClient.name,
          amount: totalAmount,
          date,
          description: description || "",
          quoteNumber: quoteNumber || undefined,
          status,
          clientInfoId: clientInfoId !== "none" ? clientInfoId : undefined,
          clientCompanyName: selectedClientInfo?.company_name,
          commissionOverride: commissionOverride ? parseFloat(commissionOverride) : undefined,
          expiresAt: expiresAt || undefined,
          notes: notes || undefined,
          // Only set addresses if they have actual values, don't auto-populate
          billingAddress: billingAddress || undefined,
          serviceAddress: serviceAddress || undefined, // Keep blank if user left it blank
          templateId: selectedTemplateId !== "none" ? selectedTemplateId : undefined
        } as Quote);
        
        onOpenChange(false);
      }
    }
  };

  const selectedSalesperson = clientId ? clients.find(c => c.id === clientId) : null;

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Edit Quote</DialogTitle>
              <DialogDescription>
                Update the quote details and items. A new version number will be assigned.
              </DialogDescription>
            </div>
            
            <QuoteDetailsSection
              quoteNumber={quoteNumber}
              onQuoteNumberChange={setQuoteNumber}
              date={date}
              onDateChange={setDate}
              expiresAt={expiresAt}
              onExpiresAtChange={setExpiresAt}
            />
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quote Name */}
          <div className="space-y-2">
            <Label htmlFor="description">Quote Name</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quote name"
            />
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="clientInfo">Client Company</Label>
            <Select value={clientInfoId} onValueChange={setClientInfoId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client selected</SelectItem>
                {clientInfos.map((clientInfo) => (
                  <SelectItem key={clientInfo.id} value={clientInfo.id}>
                    {clientInfo.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billing Address Selection */}
          <AddressSelector
            clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
            selectedAddressId={selectedBillingAddressId || undefined}
            onAddressChange={handleBillingAddressChange}
            label="Billing Address"
          />

          {/* Service Address Selection */}
          <AddressSelector
            clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
            selectedAddressId={selectedServiceAddressId || undefined}
            onAddressChange={handleServiceAddressChange}
            label="Service Address"
          />

          {/* Salesperson Display */}
          {selectedSalesperson && (
            <div className="space-y-2">
              <Label>Associated Salesperson</Label>
              <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                {selectedSalesperson.name} {selectedSalesperson.companyName && `(${selectedSalesperson.companyName})`}
              </div>
            </div>
          )}

          <QuoteItemsManager
            items={quoteItems}
            onItemsChange={setQuoteItems}
            clientInfoId={clientInfoId !== "none" ? clientInfoId : undefined}
          />

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissionOverride">Commission Override (%)</Label>
            <Input
              id="commissionOverride"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commissionOverride}
              onChange={(e) => setCommissionOverride(e.target.value)}
              placeholder="Optional commission override"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the quote"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateId">Quote Template (Optional)</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template to include" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} {template.is_default && "(Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-sm text-gray-500">
                No templates available. Create templates in System Settings.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
