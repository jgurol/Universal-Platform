import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Building2, FileText, DollarSign, Clock, Settings } from "lucide-react";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { useAuth } from "@/context/AuthContext";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { AddressSelector } from "@/components/AddressSelector";
import { useToast } from "@/hooks/use-toast";
import { useAddQuoteForm } from "@/hooks/useAddQuoteForm";
import { useQuoteDialogData } from "@/hooks/useQuoteDialogData";
import { useQuoteNumberGeneration } from "@/hooks/useQuoteNumberGeneration";
interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  clients: Client[];
  clientInfos: ClientInfo[];
}
export const AddQuoteDialog = ({
  open,
  onOpenChange,
  onAddQuote,
  clients,
  clientInfos
}: AddQuoteDialogProps) => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();

  // Debug: Log the clientInfos prop when it changes
  useEffect(() => {
    console.log('[AddQuoteDialog] Received clientInfos prop:', clientInfos.length, 'items:', clientInfos.map(c => ({
      id: c.id,
      name: c.company_name,
      agent_id: c.agent_id,
      user_id: c.user_id
    })));
  }, [clientInfos]);

  // Use our custom hooks
  const formState = useAddQuoteForm(open);
  const dialogData = useQuoteDialogData(open, clients, clientInfos, formState.clientInfoId);
  const {
    quoteNumber,
    setQuoteNumber
  } = useQuoteNumberGeneration(open);

  // Auto-select template when templates load
  useEffect(() => {
    if (dialogData.templates.length > 0 && !formState.selectedTemplateId) {
      // Auto-select default template if available, otherwise select first template
      const defaultTemplate = dialogData.templates.find(t => t.is_default);
      if (defaultTemplate) {
        console.log('[AddQuoteDialog] Auto-selecting default template:', defaultTemplate.name);
        formState.setSelectedTemplateId(defaultTemplate.id);
      } else if (dialogData.templates.length > 0) {
        console.log('[AddQuoteDialog] No default template found, selecting first template:', dialogData.templates[0].name);
        formState.setSelectedTemplateId(dialogData.templates[0].id);
      }
    }
  }, [dialogData.templates, formState.selectedTemplateId, formState.setSelectedTemplateId]);

  // Handle client selection - auto-select salesperson based on client's agent_id
  useEffect(() => {
    if (formState.clientInfoId && formState.clientInfoId !== "none") {
      const selectedClient = dialogData.filteredClientInfos.find(info => info.id === formState.clientInfoId);
      if (selectedClient && selectedClient.agent_id) {
        formState.setClientId(selectedClient.agent_id);
      } else {
        formState.setClientId("");
      }
    } else {
      formState.setClientId("");
    }
  }, [formState.clientInfoId, dialogData.filteredClientInfos, formState.setClientId]);

  // Update associated deals when clientInfoId changes
  useEffect(() => {
    formState.setAssociatedDeals(dialogData.associatedDeals);
  }, [dialogData.associatedDeals, formState.setAssociatedDeals]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.isSubmitting) {
      console.log('[AddQuoteDialog] Already submitting, ignoring duplicate submission');
      return;
    }
    console.log('[AddQuoteDialog] Form submitted - checking validation');

    // Enhanced validation with specific error messages
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a quote.",
        variant: "destructive"
      });
      return;
    }
    if (!formState.clientInfoId || formState.clientInfoId === "none") {
      toast({
        title: "Client Required",
        description: dialogData.filteredClientInfos.length === 0 ? "No client companies available. Please add a client company first in Deal Registration." : "Please select a client company before creating the quote.",
        variant: "destructive"
      });
      return;
    }
    if (!formState.date) {
      toast({
        title: "Date Required",
        description: "Please select a quote date.",
        variant: "destructive"
      });
      return;
    }
    if (formState.quoteItems.length === 0) {
      toast({
        title: "Items Required",
        description: "Please add at least one item to the quote before saving.",
        variant: "destructive"
      });
      return;
    }
    if (!formState.selectedTemplateId) {
      toast({
        title: "Template Required",
        description: dialogData.templates.length === 0 ? "No quote templates found. Please create a template in System Settings first." : "Please select a quote template.",
        variant: "destructive"
      });
      return;
    }
    formState.setIsSubmitting(true);
    try {
      const totalAmount = formState.calculateTotalAmount();
      const selectedClient = formState.clientId ? clients.find(client => client.id === formState.clientId) : null;
      const selectedClientInfo = dialogData.filteredClientInfos.find(info => info.id === formState.clientInfoId);
      if (!selectedClientInfo) {
        throw new Error("Selected client company not found");
      }
      const quoteData = {
        clientId: formState.clientId || "",
        clientName: selectedClient?.name || dialogData.currentUserName,
        companyName: selectedClientInfo.company_name,
        amount: totalAmount,
        date: formState.date,
        description: formState.description || `Quote for ${selectedClientInfo.company_name}`,
        quoteNumber: quoteNumber || undefined,
        quoteMonth: formState.quoteMonth || undefined,
        quoteYear: formState.quoteYear || undefined,
        term: formState.term,
        status: "pending" as const,
        clientInfoId: formState.clientInfoId,
        clientCompanyName: selectedClientInfo.company_name,
        commissionOverride: formState.commissionOverride ? parseFloat(formState.commissionOverride) : undefined,
        expiresAt: formState.expiresAt || undefined,
        notes: formState.notes || undefined,
        quoteItems: formState.quoteItems,
        billingAddress: formState.billingAddress || undefined,
        serviceAddress: formState.serviceAddress || undefined,
        templateId: formState.selectedTemplateId,
        user_id: user.id,
        archived: false
      };
      console.log('[AddQuoteDialog] Calling onAddQuote with data:', quoteData);
      await onAddQuote(quoteData);
      toast({
        title: "Success",
        description: "Quote created successfully!"
      });

      // Reset form after successful submission
      formState.resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('[AddQuoteDialog] Error creating quote:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      formState.setIsSubmitting(false);
    }
  };
  const selectedSalesperson = formState.clientId ? clients.find(c => c.id === formState.clientId) : null;
  const selectedClientInfo = formState.clientInfoId && formState.clientInfoId !== "none" ? dialogData.filteredClientInfos.find(info => info.id === formState.clientInfoId) : null;

  // Check if form is valid for submission
  const isFormValid = !!(user && formState.clientInfoId && formState.clientInfoId !== "none" && formState.date && formState.quoteItems.length > 0 && formState.selectedTemplateId && !formState.isSubmitting && !dialogData.isDataLoading);
  console.log('[AddQuoteDialog] Form validation status:', {
    hasUser: !!user,
    hasClientInfo: !!(formState.clientInfoId && formState.clientInfoId !== "none"),
    hasDate: !!formState.date,
    hasQuoteItems: formState.quoteItems.length > 0,
    hasTemplate: !!formState.selectedTemplateId,
    isSubmitting: formState.isSubmitting,
    isDataLoading: dialogData.isDataLoading,
    filteredClientInfosLength: dialogData.filteredClientInfos.length,
    originalClientInfosLength: clientInfos.length,
    isFormValid
  });
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] max-h-[95vh] overflow-y-auto bg-slate-300">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Create New Quote</h2>
              <p className="text-gray-600">Fill out the details below to create a professional quote for your client</p>
            </div>
          </div>
        
          {/* Show loading state while data is loading */}
          {dialogData.isDataLoading && <Card className="border-gray-200">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600">Loading form data...</p>
                </div>
              </CardContent>
            </Card>}
        
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Quote Header Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Quote Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-800">Quote Name</Label>
                  <Input id="description" value={formState.description} onChange={e => {
                  console.log('[AddQuoteDialog] Description changed to:', e.target.value);
                  formState.setDescription(e.target.value);
                }} placeholder="Enter quote name (optional - will auto-generate if empty)" disabled={dialogData.isDataLoading} className="border-gray-300 bg-white focus:border-blue-500 transition-colors" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="quoteNumber" className="text-sm font-semibold text-gray-800">Quote Number</Label>
                  <Input id="quoteNumber" value={quoteNumber} onChange={e => setQuoteNumber(e.target.value)} placeholder="Auto-generated" disabled className="border-gray-300 bg-gray-100 text-gray-600" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="date" className="text-sm font-semibold text-gray-800">
                    Quote Date <span className="text-red-500">*</span>
                  </Label>
                  <Input id="date" type="date" value={formState.date} onChange={e => formState.setDate(e.target.value)} required className="border-gray-300 bg-white focus:border-blue-500 transition-colors" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="expiresAt" className="text-sm font-semibold text-gray-800">Expiration Date</Label>
                  <Input id="expiresAt" type="date" value={formState.expiresAt} onChange={e => formState.setExpiresAt(e.target.value)} className="border-gray-300 bg-white focus:border-blue-500 transition-colors" />
                  <p className="text-xs text-gray-600">Auto-set to +60 days from quote date</p>
                </div>

                {/* Associated Salesperson */}
                {selectedSalesperson ? <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-800">Associated Salesperson</Label>
                    <div className="border rounded-md px-3 py-2 bg-gray-50 text-gray-700 border-gray-300">
                      {selectedSalesperson.name} {selectedSalesperson.companyName && `(${selectedSalesperson.companyName})`}
                    </div>
                  </div> : <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-800">Associated Salesperson</Label>
                    <div className="border rounded-md px-3 py-2 bg-gray-50 text-gray-700 border-gray-300">
                      {dialogData.currentUserName || 'Loading...'}
                    </div>
                  </div>}
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Client & Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="clientInfo" className="text-sm font-semibold text-gray-800">
                      Client Company <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formState.clientInfoId} onValueChange={formState.setClientInfoId} required disabled={dialogData.isDataLoading}>
                      <SelectTrigger className="border-gray-300 bg-white focus:border-blue-500 transition-colors">
                        <SelectValue placeholder={dialogData.isDataLoading ? "Loading client companies..." : dialogData.filteredClientInfos.length === 0 ? "No clients available - Add clients first" : "Select a client company"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-lg z-50">
                        {dialogData.isDataLoading ? <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem> : dialogData.filteredClientInfos.length === 0 ? <SelectItem value="no-clients" disabled>
                            {clientInfos.length === 0 ? "No client companies found in the database. Please add a client company in Deal Registration first." : "No client companies available for your user role. Contact your administrator if this seems incorrect."}
                          </SelectItem> : dialogData.filteredClientInfos.map(clientInfo => <SelectItem key={clientInfo.id} value={clientInfo.id} className="hover:bg-gray-100">
                              {clientInfo.company_name}
                            </SelectItem>)}
                      </SelectContent>
                    </Select>
                    {!dialogData.isDataLoading && dialogData.filteredClientInfos.length === 0 && <p className="text-sm text-red-500 mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                        {clientInfos.length === 0 ? "No client companies found in the database. Please add a client company in Deal Registration first." : "No client companies available for your user role. Contact your administrator if this seems incorrect."}
                      </p>}
                  </div>
                </div>

                {/* Associated Salesperson */}
                
                {/* Associated Deals Section - Fixed dropdown */}
                {dialogData.associatedDeals.length > 0 && <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-800">Associated Deal (Optional)</Label>
                    <Select value={formState.selectedDealId} onValueChange={formState.setSelectedDealId} disabled={dialogData.isDataLoading}>
                      <SelectTrigger className="border-gray-300 bg-white focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Select a deal to associate (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-lg z-50">
                        <SelectItem value="none" className="hover:bg-gray-100">
                          No deal selected
                        </SelectItem>
                        {dialogData.associatedDeals.map(deal => <SelectItem key={deal.id} value={deal.id} className="hover:bg-gray-100">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{deal.deal_name}</span>
                              <span className="text-sm text-gray-500">
                                ${deal.deal_value.toLocaleString()} - {deal.stage}
                              </span>
                            </div>
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    {formState.selectedDealId && formState.selectedDealId !== "none" && <p className="text-sm text-green-600 mt-2 font-medium">
                        Deal selected: {dialogData.associatedDeals.find(d => d.id === formState.selectedDealId)?.deal_name}
                      </p>}
                  </div>}

                {/* Commission Override - Only show for admins */}
                {dialogData.isAdmin && <div className="space-y-3">
                    <Label htmlFor="commissionOverride" className="text-sm font-semibold text-gray-800">Commission Override (%)</Label>
                    <Input id="commissionOverride" type="number" step="0.01" min="0" max="100" value={formState.commissionOverride} onChange={e => formState.setCommissionOverride(e.target.value)} placeholder="Optional commission override" disabled={dialogData.isDataLoading} className="border-gray-300 bg-white focus:border-blue-500 transition-colors" />
                  </div>}

                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-sm font-semibold text-gray-800">Notes</Label>
                  <Textarea id="notes" value={formState.notes} onChange={e => formState.setNotes(e.target.value)} placeholder="Additional notes about the quote" rows={4} disabled={dialogData.isDataLoading} className="border-gray-300 bg-white focus:border-blue-500 transition-colors resize-none" />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-900">Address Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AddressSelector clientInfoId={formState.clientInfoId !== "none" ? formState.clientInfoId : null} selectedAddressId={formState.selectedBillingAddressId || undefined} onAddressChange={formState.handleBillingAddressChange} label="Billing Address" autoSelectPrimary={true} />

                <AddressSelector clientInfoId={formState.clientInfoId !== "none" ? formState.clientInfoId : null} selectedAddressId={formState.selectedServiceAddressId || undefined} onAddressChange={formState.handleServiceAddressChange} label="Service Address (Optional)" autoSelectPrimary={false} />
              </CardContent>
            </Card>

            {/* Quote Items */}
            <Card className="border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Quote Items <span className="text-red-500">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteItemsManager items={formState.quoteItems} onItemsChange={formState.setQuoteItems} clientInfoId={formState.clientInfoId !== "none" ? formState.clientInfoId : undefined} />
                {formState.quoteItems.length === 0 && <p className="text-sm text-red-500 mt-3 p-3 bg-red-50 rounded-md border border-red-200">
                    Add at least one item to create the quote
                  </p>}
              </CardContent>
            </Card>

            {/* Quote Settings */}
            <Card className="border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Quote Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="templateId" className="text-sm font-semibold text-gray-800">
                    Quote Template <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formState.selectedTemplateId} onValueChange={formState.setSelectedTemplateId} required disabled={dialogData.isDataLoading}>
                    <SelectTrigger className="border-gray-300 bg-white focus:border-blue-500 transition-colors">
                      <SelectValue placeholder={dialogData.isDataLoading ? "Loading templates..." : dialogData.templates.length === 0 ? "No templates available" : formState.selectedTemplateId ? `${dialogData.templates.find(t => t.id === formState.selectedTemplateId)?.name}${dialogData.templates.find(t => t.id === formState.selectedTemplateId)?.is_default ? " (Default)" : ""}` : "Select a quote template"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg z-50">
                      {dialogData.isDataLoading ? <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem> : dialogData.templates.length === 0 ? <SelectItem value="no-templates" disabled>
                          No templates available - Create templates first
                        </SelectItem> : dialogData.templates.map(template => <SelectItem key={template.id} value={template.id} className="hover:bg-gray-100">
                            {template.name}{template.is_default ? " (Default)" : ""}
                          </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!dialogData.isDataLoading && dialogData.templates.length === 0 && <p className="text-sm text-red-500 mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                      No quote templates found. Please create a template in System Settings → Quote Templates first.
                    </p>}
                 </div>

                 <div className="space-y-3">
                   <Label htmlFor="term" className="text-sm font-semibold text-gray-800">Initial Term</Label>
                   <Select value={formState.term} onValueChange={formState.setTerm} disabled={dialogData.isDataLoading}>
                     <SelectTrigger className="border-gray-300 bg-white focus:border-blue-500 transition-colors">
                       <SelectValue placeholder="Select initial term" />
                     </SelectTrigger>
                     <SelectContent className="bg-white border-gray-200 shadow-lg z-50">
                       <SelectItem value="Month to Month" className="hover:bg-gray-100">Month to Month</SelectItem>
                       <SelectItem value="12 Months" className="hover:bg-gray-100">12 Months</SelectItem>
                       <SelectItem value="24 Months" className="hover:bg-gray-100">24 Months</SelectItem>
                       <SelectItem value="36 Months" className="hover:bg-gray-100">36 Months</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </CardContent>
            </Card>
            
            <Separator className="bg-gray-200" />
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={formState.isSubmitting} className="px-6 border-gray-300 text-gray-700 hover:bg-gray-100">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6" disabled={!isFormValid}>
                {formState.isSubmitting ? <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Quote...
                  </> : "Create Quote"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>;
};
