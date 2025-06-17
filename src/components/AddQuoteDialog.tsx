
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { AddressSelector } from "@/components/AddressSelector";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { QuoteItemData } from "@/types/quoteItems";
import { useQuoteItems } from "@/hooks/useQuoteItems";
import { calculateTotalsByChargeType } from "@/services/quoteItemsService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
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
  const [status, setStatus] = useState("pending");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionOverride, setCommissionOverride] = useState("");

  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [selectedServiceAddressId, setSelectedServiceAddressId] = useState<string | null>(null);
  const [serviceAddress, setServiceAddress] = useState<string>("");

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const { user } = useAuth();

  const { quoteItems, setQuoteItems } = useQuoteItems(null, open);

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

  const handleBillingAddressChange = (addressId: string | null, customAddr?: string) => {
    setSelectedBillingAddressId(addressId);
    setBillingAddress(customAddr || "");
  };

  const handleServiceAddressChange = (addressId: string | null, customAddr?: string) => {
    setSelectedServiceAddressId(addressId);
    setServiceAddress(customAddr || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientId && date) {
      const selectedClient = clients.find(client => client.id === clientId);
      const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? clientInfos.find(info => info.id === clientInfoId) : null;
      
      if (selectedClient) {
        const { totalAmount } = calculateTotalsByChargeType(quoteItems);
        
        onAddQuote({
          clientId,
          clientName: selectedClient.name,
          companyName: selectedClient.companyName || selectedClient.name,
          amount: totalAmount,
          date,
          description: description || "",
          quoteNumber: quoteNumber || undefined,
          quoteMonth: quoteMonth || undefined,
          quoteYear: quoteYear || undefined,
          status,
          clientInfoId: clientInfoId !== "none" ? clientInfoId : undefined,
          clientCompanyName: selectedClientInfo?.company_name,
          commissionOverride: commissionOverride ? parseFloat(commissionOverride) : undefined,
          expiresAt: expiresAt || undefined,
          notes: notes || undefined,
          billingAddress: billingAddress || undefined,
          serviceAddress: serviceAddress || undefined,
          templateId: selectedTemplateId !== "none" ? selectedTemplateId : undefined
        } as Omit<Quote, "id">);
        
        // Reset form
        setClientId("");
        setClientInfoId("");
        setDate("");
        setDescription("");
        setQuoteNumber("");
        setQuoteMonth("");
        setQuoteYear("");
        setStatus("pending");
        setExpiresAt("");
        setNotes("");
        setCommissionOverride("");
        setBillingAddress("");
        setServiceAddress("");
        setSelectedBillingAddressId(null);
        setSelectedServiceAddressId(null);
        setSelectedTemplateId("none");
        setQuoteItems([]);
        onOpenChange(false);
      }
    }
  };

  const selectedSalesperson = clientId ? clients.find(c => c.id === clientId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="bg-muted/30 p-4 rounded-lg -mx-6 -mt-6 mb-6">
            <DialogTitle>Add New Quote</DialogTitle>
            <DialogDescription>
              Create a new quote by filling out the details below.
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Quote Name</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter quote name"
              />
            </div>

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

            {selectedSalesperson && (
              <div className="space-y-2">
                <Label>Associated Salesperson</Label>
                <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                  {selectedSalesperson.name} {selectedSalesperson.companyName && `(${selectedSalesperson.companyName})`}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Address Information Section */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Address Information</h3>
            
            <AddressSelector
              clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
              selectedAddressId={selectedBillingAddressId || undefined}
              onAddressChange={handleBillingAddressChange}
              label="Billing Address"
              autoSelectPrimary={false}
            />

            <AddressSelector
              clientInfoId={clientInfoId !== "none" ? clientInfoId : null}
              selectedAddressId={selectedServiceAddressId || undefined}
              onAddressChange={handleServiceAddressChange}
              label="Service Address"
              autoSelectPrimary={false}
            />
          </div>

          {/* Quote Items Section */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-4">Quote Items</h3>
            <QuoteItemsManager
              items={quoteItems}
              onItemsChange={setQuoteItems}
              clientInfoId={clientInfoId !== "none" ? clientInfoId : undefined}
            />
          </div>

          {/* Template Section */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Quote Template</h3>
            
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
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
