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
      <DialogContent className="sm:max-w-[1400px] max-h-[95vh] overflow-y-auto bg-slate-300">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Edit Quote</h2>
              <p className="text-gray-600">Update quote details and settings</p>
            </div>
          </div>
        
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quote Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Quote Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-semibold text-gray-800">Quote Name</label>
                    <input 
                      id="description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Enter quote name" 
                      className="w-full border rounded-md px-3 py-2 border-gray-300 bg-white focus:border-blue-500 transition-colors" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-semibold text-gray-800">Notes</label>
                    <textarea 
                      id="notes" 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Additional notes about the quote" 
                      rows={2} 
                      className="w-full border rounded-md px-3 py-2 border-gray-300 bg-white focus:border-blue-500 transition-colors resize-none" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label htmlFor="quoteNumber" className="text-sm font-semibold text-gray-800">Quote Number</label>
                    <input 
                      id="quoteNumber" 
                      value={quoteNumber} 
                      onChange={(e) => setQuoteNumber(e.target.value)} 
                      placeholder="Auto-generated" 
                      disabled 
                      className="w-full border rounded-md px-3 py-2 border-gray-300 bg-gray-100 text-gray-600" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="date" className="text-sm font-semibold text-gray-800">
                      Quote Date <span className="text-red-500">*</span>
                    </label>
                    <input 
                      id="date" 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      required 
                      className="w-full border rounded-md px-3 py-2 border-gray-300 bg-white focus:border-blue-500 transition-colors" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="expiresAt" className="text-sm font-semibold text-gray-800">Expiration Date</label>
                    <input 
                      id="expiresAt" 
                      type="date" 
                      value={expiresAt} 
                      onChange={(e) => setExpiresAt(e.target.value)} 
                      className="w-full border rounded-md px-3 py-2 border-gray-300 bg-white focus:border-blue-500 transition-colors" 
                    />
                  </div>

                  {/* Associated Salesperson */}
                  {selectedSalesperson ? (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-800">Associated Salesperson</label>
                      <div className="border rounded-md px-3 py-2 bg-gray-50 text-gray-700 border-gray-300">
                        {selectedSalesperson.name} {selectedSalesperson.companyName && `(${selectedSalesperson.companyName})`}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-800">Associated Salesperson</label>
                      <div className="border rounded-md px-3 py-2 bg-gray-50 text-gray-700 border-gray-300">
                        No Salesperson Assigned
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Client Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="clientInfo" className="text-sm font-semibold text-gray-800">
                      Client Company <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={clientInfoId} 
                      onChange={(e) => setClientInfoId(e.target.value)} 
                      required 
                      className="w-full border rounded-md px-3 py-2 border-gray-300 bg-white focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select a client company</option>
                      {clientInfos.map((clientInfo) => (
                        <option key={clientInfo.id} value={clientInfo.id}>
                          {clientInfo.company_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-semibold text-gray-800">Status</label>
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value)} 
                      className="w-full border rounded-md px-3 py-2 border-gray-300 bg-white focus:border-blue-500 transition-colors"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="commissionOverride" className="text-sm font-semibold text-gray-800">Commission Override (%)</label>
                  <input 
                    id="commissionOverride" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="100" 
                    value={commissionOverride} 
                    onChange={(e) => setCommissionOverride(e.target.value)} 
                    placeholder="Leave empty to use default commission" 
                    className="w-full border rounded-md px-3 py-2 border-gray-300 bg-white focus:border-blue-500 transition-colors" 
                  />
                </div>

                {/* Address Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <EditQuoteAddressSection 
                      clientInfoId={clientInfoId} 
                      selectedBillingAddressId={selectedBillingAddressId} 
                      onBillingAddressChange={handleBillingAddressChange} 
                      selectedServiceAddressId={selectedServiceAddressId} 
                      onServiceAddressChange={handleServiceAddressChange} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Items */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Quote Items <span className="text-red-500">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteItemsManager 
                  items={quoteItems} 
                  onItemsChange={setQuoteItems} 
                  clientInfoId={clientInfoId !== "none" ? clientInfoId : undefined} 
                />
                {quoteItems.length === 0 && (
                  <p className="text-sm text-red-500 mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                    Add at least one item to update the quote
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quote Settings */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Quote Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label htmlFor="templateId" className="text-sm font-semibold text-gray-800">
                    Quote Template <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={selectedTemplateId} 
                    onChange={(e) => setSelectedTemplateId(e.target.value)} 
                    required 
                    className="w-full border rounded-md px-3 py-2 border-gray-300 bg-white focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select a quote template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}{template.is_default ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p className="text-sm text-red-500 mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                      No quote templates found. Please create a template in System Settings → Quote Templates first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="term" className="text-sm font-semibold text-gray-800">Initial Term</label>
                  <select 
                    value={term} 
                    onChange={(e) => handleTermChange(e.target.value)} 
                    className="w-full border rounded-md px-3 py-2 border-gray-300 bg-white focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select initial term</option>
                    <option value="Month to Month">Month to Month</option>
                    <option value="12 Months">12 Months</option>
                    <option value="24 Months">24 Months</option>
                    <option value="36 Months">36 Months</option>
                  </select>
                </div>
              </CardContent>
            </Card>
            
            <Separator className="bg-gray-200" />
            
            <div className="flex justify-end space-x-3 pt-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="px-6 border-gray-300 text-gray-700 hover:bg-gray-100">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating Quote...
                  </>
                ) : (
                  "Update Quote"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>;
};
