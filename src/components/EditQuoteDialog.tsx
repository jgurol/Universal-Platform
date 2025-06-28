import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { useToast } from "@/hooks/use-toast";
import { FileText, Building2, DollarSign, Settings } from "lucide-react";
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
    toast
  } = useToast();

  // Add debugging for the quote prop
  useEffect(() => {
    if (quote && open) {
      console.log('[EditQuoteDialog] Quote prop received:', {
        id: quote.id,
        term: quote.term,
        termType: typeof quote.term,
        termExists: quote.hasOwnProperty('term'),
        fullQuote: quote
      });
    }
  }, [quote, open]);

  // Add effect to fetch fresh quote data directly in the dialog
  useEffect(() => {
    const fetchFreshQuoteData = async () => {
      if (quote && quote.id && open) {
        console.log('[EditQuoteDialog] Fetching fresh quote data for:', quote.id);
        try {
          const {
            data,
            error
          } = await supabase.from('quotes').select('*').eq('id', quote.id).single();
          if (error) {
            console.error('[EditQuoteDialog] Error fetching fresh quote:', error);
            return;
          }
          console.log('[EditQuoteDialog] Fresh quote from DB vs prop:', {
            dbTerm: data.term,
            propTerm: quote.term,
            dbStatus: data.status,
            propStatus: quote.status,
            match: data.term === quote.term
          });
        } catch (err) {
          console.error('[EditQuoteDialog] Error in fresh fetch:', err);
        }
      }
    };
    fetchFreshQuoteData();
  }, [quote?.id, open]);
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
    setCommissionOverride,
    term,
    setTerm
  } = useQuoteForm(quote, open);
  const {
    quoteItems,
    setQuoteItems
  } = useQuoteItems(quote, open);
  const {
    addresses
  } = useClientAddresses(clientInfoId !== "none" ? clientInfoId : null);
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [selectedServiceAddressId, setSelectedServiceAddressId] = useState<string | null>(null);
  const [serviceAddress, setServiceAddress] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    user
  } = useAuth();

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

  // Load templates when dialog opens and auto-select default if none selected
  useEffect(() => {
    const fetchTemplates = async () => {
      if (open && user) {
        console.log('[EditQuoteDialog] Fetching templates for user:', user.id);
        try {
          const {
            data,
            error
          } = await supabase.from('quote_templates').select('*').order('name');
          console.log('[EditQuoteDialog] Templates query result:', {
            data,
            error
          });
          if (error) {
            console.error('[EditQuoteDialog] Error fetching templates:', error);
            throw error;
          }
          setTemplates(data || []);
          console.log('[EditQuoteDialog] Templates set:', data?.length || 0, 'templates');
        } catch (error) {
          console.error('[EditQuoteDialog] Error loading templates:', error);
        }
      }
    };
    fetchTemplates();
  }, [open, user]);

  // Initialize template selection from quote or auto-select default
  useEffect(() => {
    if (quote && open && templates.length > 0) {
      const existingTemplateId = (quote as any).templateId;
      if (existingTemplateId) {
        setSelectedTemplateId(existingTemplateId);
      } else {
        // Auto-select default template if no template is currently selected
        const defaultTemplate = templates.find(t => t.is_default);
        if (defaultTemplate) {
          console.log('[EditQuoteDialog] Auto-selecting default template:', defaultTemplate.name);
          setSelectedTemplateId(defaultTemplate.id);
        } else if (templates.length > 0) {
          console.log('[EditQuoteDialog] No default template found, selecting first template:', templates[0].name);
          setSelectedTemplateId(templates[0].id);
        }
      }
    }
  }, [quote, open, templates]);
  const handleBillingAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('EditQuoteDialog - Billing address changed:', {
      addressId,
      customAddr
    });
    setSelectedBillingAddressId(addressId);
    setBillingAddress(customAddr || "");
  };
  const handleServiceAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('EditQuoteDialog - Service address changed:', {
      addressId,
      customAddr
    });
    setSelectedServiceAddressId(addressId);
    setServiceAddress(customAddr || "");
  };
  const handleTermChange = (value: string) => {
    console.log('[EditQuoteDialog] Term changed to:', value);
    setTerm(value);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      console.log('[EditQuoteDialog] Already submitting, ignoring duplicate submission');
      return;
    }
    console.log('[EditQuoteDialog] Form submitted - checking validation');
    console.log('[EditQuoteDialog] Form data:', {
      quote: !!quote,
      clientInfoId,
      date,
      quoteItemsLength: quoteItems.length,
      clientsLength: clients.length,
      selectedTemplateId,
      term
    });
    if (!quote) {
      console.error('[EditQuoteDialog] No quote provided');
      toast({
        title: "Error",
        description: "No quote provided for update",
        variant: "destructive"
      });
      return;
    }
    if (!date) {
      console.error('[EditQuoteDialog] No date provided');
      toast({
        title: "Error",
        description: "Quote date is required",
        variant: "destructive"
      });
      return;
    }
    if (quoteItems.length === 0) {
      console.error('[EditQuoteDialog] No quote items provided');
      toast({
        title: "Error",
        description: "At least one quote item is required",
        variant: "destructive"
      });
      return;
    }
    if (!clientInfoId || clientInfoId === "none") {
      console.error('[EditQuoteDialog] No client info selected');
      toast({
        title: "Error",
        description: "Please select a client company",
        variant: "destructive"
      });
      return;
    }
    if (!selectedTemplateId) {
      console.error('[EditQuoteDialog] No template selected');
      toast({
        title: "Error",
        description: "Please select a quote template",
        variant: "destructive"
      });
      return;
    }
    const selectedClient = clientId ? clients.find(client => client.id === clientId) : null;
    const selectedClientInfo = clientInfos.find(info => info.id === clientInfoId);
    if (!selectedClientInfo) {
      console.error('[EditQuoteDialog] Selected client info not found');
      toast({
        title: "Error",
        description: "Selected client company not found",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      console.log('[EditQuoteDialog] Validation passed, updating quote');
      console.log('[EditQuoteDialog] Term value being saved:', term);
      const {
        totalAmount
      } = calculateTotalsByChargeType(quoteItems);
      console.log('[EditQuoteDialog] Saving quote items before updating quote:', quoteItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        address_id: item.address_id
      })));

      // Update quote items in database with address information and custom descriptions
      await updateQuoteItems(quote.id, quoteItems);
      console.log('EditQuoteDialog - Updating quote with addresses and term:', {
        billing: billingAddress,
        service: serviceAddress,
        term: term
      });
      const updatedQuote: Quote = {
        ...quote,
        clientId: clientId || "",
        clientName: selectedClient?.name || "No Salesperson Assigned",
        companyName: selectedClientInfo.company_name,
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
        term: term || undefined,
        // Ensure term is included
        billingAddress: billingAddress || undefined,
        serviceAddress: serviceAddress || undefined,
        templateId: selectedTemplateId
      };
      console.log('[EditQuoteDialog] Final updatedQuote object with term:', updatedQuote.term);
      onUpdateQuote(updatedQuote);
      toast({
        title: "Success",
        description: "Quote updated successfully"
      });
      onOpenChange(false);
    } catch (error) {
      console.error('[EditQuoteDialog] Error updating quote:', error);
      toast({
        title: "Error",
        description: "Failed to update quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const selectedSalesperson = clientId ? clients.find(c => c.id === clientId) : null;

  // Updated form validation - must include template selection
  const isFormValid = !!(quote && date && quoteItems.length > 0 && clientInfoId && clientInfoId !== "none" && selectedTemplateId);
  console.log('[EditQuoteDialog] Form validation status:', {
    hasQuote: !!quote,
    hasDate: !!date,
    hasQuoteItems: quoteItems.length > 0,
    hasClientInfo: !!(clientInfoId && clientInfoId !== "none"),
    hasTemplate: !!selectedTemplateId,
    isFormValid,
    currentTerm: term
  });
  if (!quote) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] max-h-[95vh] overflow-y-auto bg-gray-500">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Edit Quote</h2>
              <p className="text-muted-foreground">Update quote details and settings</p>
            </div>
          </div>
        
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Quote Header Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quote Information</CardTitle>
              </CardHeader>
              <CardContent>
                <EditQuoteHeader quoteNumber={quoteNumber} onQuoteNumberChange={setQuoteNumber} date={date} onDateChange={setDate} expiresAt={expiresAt} onExpiresAtChange={setExpiresAt} selectedSalesperson={selectedSalesperson} />
              </CardContent>
            </Card>
            
            {/* Client & Form Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Client & Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EditQuoteFormFields description={description} onDescriptionChange={setDescription} clientInfoId={clientInfoId} onClientInfoIdChange={setClientInfoId} clientInfos={clientInfos} status={status} onStatusChange={setStatus} commissionOverride={commissionOverride} onCommissionOverrideChange={setCommissionOverride} notes={notes} onNotesChange={setNotes} term={term} onTermChange={handleTermChange} />
              </CardContent>
            </Card>

            {/* Address Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address Information</CardTitle>
              </CardHeader>
              <CardContent>
                <EditQuoteAddressSection clientInfoId={clientInfoId} selectedBillingAddressId={selectedBillingAddressId} onBillingAddressChange={handleBillingAddressChange} selectedServiceAddressId={selectedServiceAddressId} onServiceAddressChange={handleServiceAddressChange} />
              </CardContent>
            </Card>

            {/* Quote Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Quote Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteItemsManager items={quoteItems} onItemsChange={setQuoteItems} clientInfoId={clientInfoId !== "none" ? clientInfoId : undefined} />
              </CardContent>
            </Card>

            {/* Template Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Quote Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EditQuoteTemplateSection selectedTemplateId={selectedTemplateId} onTemplateChange={setSelectedTemplateId} templates={templates} />
                {templates.length === 0 && <p className="text-sm text-red-500 mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                    No templates available. Create templates in System Settings → Quote Templates.
                  </p>}
              </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="px-6">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </> : "Update Quote"}
              </Button>
            </div>
            
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && <div className="text-xs text-muted-foreground p-3 bg-gray-50 rounded border">
                Debug: Form valid = {isFormValid ? 'true' : 'false'} 
                (Quote: {!!quote ? 'yes' : 'no'}, Date: {!!date ? 'yes' : 'no'}, Items: {quoteItems.length}, ClientInfo: {clientInfoId && clientInfoId !== "none" ? 'yes' : 'no'}, Template: {!!selectedTemplateId ? 'yes' : 'no'}, Term: {term || 'none'})
              </div>}
          </form>
        </div>
      </DialogContent>
    </Dialog>;
};