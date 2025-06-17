
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { useQuoteForm } from "@/hooks/useQuoteForm";
import { useQuoteItems } from "@/hooks/useQuoteItems";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { updateQuoteItems, calculateTotalsByChargeType } from "@/services/quoteItemsService";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { EditQuoteHeader } from "@/components/EditQuote/EditQuoteHeader";
import { EditQuoteAddressSection } from "@/components/EditQuote/EditQuoteAddressSection";
import { EditQuoteTemplateSection } from "@/components/EditQuote/EditQuoteTemplateSection";
import { EditQuoteFormFields } from "@/components/EditQuote/EditQuoteFormFields";

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
  const { addresses } = useClientAddresses(clientInfoId !== "none" ? clientInfoId : null);
  
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [selectedServiceAddressId, setSelectedServiceAddressId] = useState<string | null>(null);
  const [serviceAddress, setServiceAddress] = useState<string>("");

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const { user } = useAuth();

  // Helper function to find matching address ID from address string
  const findMatchingAddressId = (addressString: string, addresses: any[]) => {
    if (!addressString || !addresses.length) return null;
    
    const matchingAddress = addresses.find(addr => {
      const formattedAddress = `${addr.street_address}${addr.street_address_2 ? `, ${addr.street_address_2}` : ''}, ${addr.city}, ${addr.state} ${addr.zip_code}`;
      return formattedAddress === addressString;
    });
    
    return matchingAddress ? matchingAddress.id : null;
  };

  // Initialize addresses from quote - check if they match existing addresses
  useEffect(() => {
    if (quote && open && addresses.length > 0) {
      console.log('EditQuoteDialog - Initializing addresses with quote data:', { 
        billing: quote.billingAddress, 
        service: quote.serviceAddress,
        addressesCount: addresses.length 
      });

      // Handle billing address
      if (quote.billingAddress) {
        const matchingBillingId = findMatchingAddressId(quote.billingAddress, addresses);
        if (matchingBillingId) {
          console.log('EditQuoteDialog - Found matching billing address ID:', matchingBillingId);
          setSelectedBillingAddressId(matchingBillingId);
          setBillingAddress(quote.billingAddress);
        } else {
          console.log('EditQuoteDialog - Billing address is custom');
          setSelectedBillingAddressId(null);
          setBillingAddress(quote.billingAddress);
        }
      } else {
        setSelectedBillingAddressId(null);
        setBillingAddress("");
      }

      // Handle service address
      if (quote.serviceAddress) {
        const matchingServiceId = findMatchingAddressId(quote.serviceAddress, addresses);
        if (matchingServiceId) {
          console.log('EditQuoteDialog - Found matching service address ID:', matchingServiceId);
          setSelectedServiceAddressId(matchingServiceId);
          setServiceAddress(quote.serviceAddress);
        } else {
          console.log('EditQuoteDialog - Service address is custom');
          setSelectedServiceAddressId(null);
          setServiceAddress(quote.serviceAddress);
        }
      } else {
        setSelectedServiceAddressId(null);
        setServiceAddress("");
      }
    } else if (quote && open) {
      // If no addresses loaded yet, just set the string values
      setBillingAddress(quote.billingAddress || "");
      setServiceAddress(quote.serviceAddress || "");
    }
  }, [quote, open, addresses]);

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
    setBillingAddress(customAddr || "");
  };

  const handleServiceAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('EditQuoteDialog - Service address changed:', { addressId, customAddr });
    setSelectedServiceAddressId(addressId);
    setServiceAddress(customAddr || "");
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

        console.log('EditQuoteDialog - Updating quote with addresses:', { 
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
          billingAddress: billingAddress || undefined,
          serviceAddress: serviceAddress || undefined,
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
        <EditQuoteHeader
          quoteNumber={quoteNumber}
          onQuoteNumberChange={setQuoteNumber}
          date={date}
          onDateChange={setDate}
          expiresAt={expiresAt}
          onExpiresAtChange={setExpiresAt}
        />
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <EditQuoteFormFields
            description={description}
            onDescriptionChange={setDescription}
            clientInfoId={clientInfoId}
            onClientInfoIdChange={setClientInfoId}
            clientInfos={clientInfos}
            selectedSalesperson={selectedSalesperson}
            status={status}
            onStatusChange={setStatus}
            commissionOverride={commissionOverride}
            onCommissionOverrideChange={setCommissionOverride}
            notes={notes}
            onNotesChange={setNotes}
          />

          <EditQuoteAddressSection
            clientInfoId={clientInfoId}
            selectedBillingAddressId={selectedBillingAddressId}
            onBillingAddressChange={handleBillingAddressChange}
            selectedServiceAddressId={selectedServiceAddressId}
            onServiceAddressChange={handleServiceAddressChange}
          />

          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">Quote Items</h3>
            <QuoteItemsManager
              items={quoteItems}
              onItemsChange={setQuoteItems}
              clientInfoId={clientInfoId !== "none" ? clientInfoId : undefined}
            />
          </div>

          <EditQuoteTemplateSection
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={setSelectedTemplateId}
            templates={templates}
          />

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
