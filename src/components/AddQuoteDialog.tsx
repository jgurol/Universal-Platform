import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { getTodayInTimezone } from "@/utils/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { QuoteItemData } from "@/types/quoteItems";
import { AddressSelector } from "@/components/AddressSelector";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  clients: Client[];
  clientInfos: ClientInfo[]; 
}

export const AddQuoteDialog = ({ open, onOpenChange, onAddQuote, clients, clientInfos }: AddQuoteDialogProps) => {
  const [clientId, setClientId] = useState("");
  const [clientInfoId, setClientInfoId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteMonth, setQuoteMonth] = useState("");
  const [quoteYear, setQuoteYear] = useState("");
  const [term, setTerm] = useState("36 Months");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionOverride, setCommissionOverride] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItemData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [serviceAddress, setServiceAddress] = useState<string>("");
  const [selectedServiceAddressId, setSelectedServiceAddressId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const { user } = useAuth();
  
  // Function to reset all form fields
  const resetForm = () => {
    setClientId("");
    setClientInfoId("");
    setDescription("");
    setQuoteNumber("");
    setQuoteMonth("");
    setQuoteYear("");
    setTerm("36 Months");
    setNotes("");
    setCommissionOverride("");
    setQuoteItems([]);
    setSelectedAddressId(null);
    setBillingAddress("");
    setSelectedBillingAddressId(null);
    setServiceAddress(""); // Reset to empty, don't auto-populate
    setSelectedServiceAddressId(null);
    setSelectedTemplateId("none");
    
    // Reset dates
    const todayDate = getTodayInTimezone();
    setDate(todayDate);
    setExpiresAt(calculateExpirationDate(todayDate));
  };
  
  // Function to calculate expiration date (+60 days from quote date)
  const calculateExpirationDate = (quoteDate: string): string => {
    if (!quoteDate) return "";
    
    const date = new Date(quoteDate);
    date.setDate(date.getDate() + 60);
    
    // Format as YYYY-MM-DD for input
    return date.toISOString().split('T')[0];
  };
  
  // Initialize date with today's date in the configured timezone
  useEffect(() => {
    if (!date) {
      const todayDate = getTodayInTimezone();
      setDate(todayDate);
      setExpiresAt(calculateExpirationDate(todayDate));
    }
  }, []);

  // Update expiration date when quote date changes
  useEffect(() => {
    if (date) {
      setExpiresAt(calculateExpirationDate(date));
    }
  }, [date]);

  // Reset form when dialog opens or closes
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Generate next quote number when dialog opens - starting from 3500
  useEffect(() => {
    const generateNextQuoteNumber = async () => {
      if (open && user) {
        try {
          const { data, error } = await supabase
            .from('quotes')
            .select('quote_number')
            .eq('user_id', user.id)
            .not('quote_number', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error('Error fetching last quote number:', error);
            setQuoteNumber("3500");
            return;
          }

          let nextNumber = 3500; // Start from 3500 instead of 1
          if (data && data.length > 0 && data[0].quote_number) {
            const lastNumber = parseInt(data[0].quote_number);
            if (!isNaN(lastNumber)) {
              nextNumber = Math.max(lastNumber + 1, 3500); // Ensure we never go below 3500
            }
          }
          
          setQuoteNumber(nextNumber.toString());
        } catch (err) {
          console.error('Error generating quote number:', err);
          setQuoteNumber("3500");
        }
      }
    };

    generateNextQuoteNumber();
  }, [open, user]);
  
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
          
          // Auto-select default template if available
          const defaultTemplate = data?.find(t => t.is_default);
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id);
          }
        } catch (error) {
          console.error('Error loading templates:', error);
        }
      }
    };

    fetchTemplates();
  }, [open, user]);

  // Handle client selection - auto-select salesperson based on client's agent_id
  useEffect(() => {
    if (clientInfoId && clientInfoId !== "none") {
      const selectedClient = clientInfos.find(info => info.id === clientInfoId);
      
      if (selectedClient && selectedClient.agent_id) {
        setClientId(selectedClient.agent_id);
      } else {
        setClientId("");
      }
    } else {
      setClientId("");
    }
  }, [clientInfoId, clientInfos]);

  const handleAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('AddQuoteDialog - Address changed:', { addressId, customAddr });
    setSelectedAddressId(addressId);
    setBillingAddress(customAddr || "");
  };

  const handleBillingAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('AddQuoteDialog - Billing address changed:', { addressId, customAddr });
    setSelectedBillingAddressId(addressId);
    setBillingAddress(customAddr || "");
  };

  const handleServiceAddressChange = (addressId: string | null, customAddr?: string) => {
    console.log('AddQuoteDialog - Service address changed (strict no auto-population):', { addressId, customAddr });
    setSelectedServiceAddressId(addressId);
    // Only set if there's an actual custom address, otherwise keep empty
    setServiceAddress(customAddr || "");
  };

  const calculateTotalAmount = () => {
    return quoteItems.reduce((total, item) => total + item.total_price, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[AddQuoteDialog] Form submitted with addresses (no auto-population):', { 
      billing: billingAddress, 
      service: serviceAddress 
    });
    
    const totalAmount = calculateTotalAmount();
    
    // Fix: Check for clientInfoId instead of clientId, since clientId can be empty if no salesperson is associated
    if (clientInfoId && clientInfoId !== "none" && date) {
      const selectedClient = clientId ? clients.find(client => client.id === clientId) : null;
      const selectedClientInfo = clientInfos.find(info => info.id === clientInfoId);
      
      if (selectedClientInfo) {
        const quoteData = {
          clientId: clientId || "", // Allow empty clientId if no salesperson is associated
          clientName: selectedClient?.name || "No Salesperson Assigned",
          companyName: selectedClientInfo.company_name,
          amount: totalAmount,
          date,
          description: description, // Keep the description as-is, don't default to empty string
          quoteNumber: quoteNumber || undefined,
          quoteMonth: quoteMonth || undefined,
          quoteYear: quoteYear || undefined,
          term: term,
          status: "pending", // Always set to pending instead of using state
          clientInfoId: clientInfoId,
          clientCompanyName: selectedClientInfo.company_name,
          commissionOverride: commissionOverride ? parseFloat(commissionOverride) : undefined,
          expiresAt: expiresAt || undefined,
          notes: notes || undefined,
          quoteItems: quoteItems.map(item => ({
            ...item,
            address_id: selectedBillingAddressId || selectedServiceAddressId || undefined
          })),
          billingAddress: billingAddress || undefined,
          serviceAddress: serviceAddress || undefined, // Keep blank if user left it blank - no auto-population
          templateId: selectedTemplateId !== "none" ? selectedTemplateId : undefined
        };
        
        console.log('[AddQuoteDialog] Calling onAddQuote with data (service address may be blank):', quoteData);
        onAddQuote(quoteData);
        
        // Reset form after successful submission
        resetForm();
        onOpenChange(false);
      }
    }
  };

  const selectedSalesperson = clientId ? clients.find(c => c.id === clientId) : null;
  const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? clientInfos.find(info => info.id === clientInfoId) : null;

  // Check if form is valid for submission
  const isFormValid = clientInfoId && clientInfoId !== "none" && quoteItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Add Quote</DialogTitle>
              <DialogDescription>
                Create a new quote for a client.
              </DialogDescription>
            </div>
            
            {/* Quote Details - Top Right */}
            <div className="grid grid-cols-1 gap-3 min-w-[280px]">
              <div className="space-y-2">
                <Label htmlFor="quoteNumber" className="text-sm">Quote Number</Label>
                <Input
                  id="quoteNumber"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  placeholder="Auto-generated"
                  disabled
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm">Quote Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt" className="text-sm">Expiration Date (Auto +60 days)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quote Name - Moved to top */}
          <div className="space-y-2">
            <Label htmlFor="description">Quote Name</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => {
                console.log('[AddQuoteDialog] Description changed to:', e.target.value);
                setDescription(e.target.value);
              }}
              placeholder="Enter quote name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientInfo">Client Company (Required)</Label>
            <Select value={clientInfoId} onValueChange={setClientInfoId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client company" />
              </SelectTrigger>
              <SelectContent>
                {clientInfos.length === 0 ? (
                  <SelectItem value="no-clients" disabled>
                    No clients available - Add clients first
                  </SelectItem>
                ) : (
                  clientInfos.map((clientInfo) => (
                    <SelectItem key={clientInfo.id} value={clientInfo.id}>
                      {clientInfo.company_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Month to Month">Month to Month</SelectItem>
                <SelectItem value="12 Months">12 Months</SelectItem>
                <SelectItem value="24 Months">24 Months</SelectItem>
                <SelectItem value="36 Months">36 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AddressSelector
            clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
            selectedAddressId={selectedBillingAddressId || undefined}
            onAddressChange={handleBillingAddressChange}
            label="Billing Address"
            autoSelectPrimary={true}
          />

          {/* Service Address Selection - NO auto-selection */}
          <AddressSelector
            clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
            selectedAddressId={selectedServiceAddressId || undefined}
            onAddressChange={handleServiceAddressChange}
            label="Service Address (Optional)"
            autoSelectPrimary={false}
          />

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
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!isFormValid}
            >
              Add Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
