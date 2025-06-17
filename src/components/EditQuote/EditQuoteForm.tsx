
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { AddressSelector } from "@/components/AddressSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

interface EditQuoteFormProps {
  quote: Quote;
  clients: Client[];
  clientInfos: ClientInfo[];
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  // Form state props
  clientId: string;
  setClientId: (value: string) => void;
  clientInfoId: string;
  setClientInfoId: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  quoteNumber: string;
  setQuoteNumber: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  expiresAt: string;
  setExpiresAt: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  commissionOverride: string;
  setCommissionOverride: (value: string) => void;
}

export const EditQuoteForm = ({
  quote,
  clients,
  clientInfos,
  onSubmit,
  onCancel,
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
}: EditQuoteFormProps) => {
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [selectedServiceAddressId, setSelectedServiceAddressId] = useState<string | null>(null);
  const [serviceAddress, setServiceAddress] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const { user } = useAuth();

  // Initialize addresses from quote
  useEffect(() => {
    if (quote) {
      setBillingAddress(quote.billingAddress || "");
      setServiceAddress(quote.serviceAddress || "");
      setSelectedBillingAddressId(null);
      setSelectedServiceAddressId(null);
    }
  }, [quote]);

  // Load templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (user) {
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
  }, [user]);

  // Initialize template selection
  useEffect(() => {
    if (quote) {
      setSelectedTemplateId((quote as any).templateId || "none");
    }
  }, [quote]);

  const handleBillingAddressChange = (addressId: string | null, customAddr?: string) => {
    setSelectedBillingAddressId(addressId);
    setBillingAddress(customAddr || "");
  };

  const handleServiceAddressChange = (addressId: string | null, customAddr?: string) => {
    setSelectedServiceAddressId(addressId);
    setServiceAddress(customAddr || "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      billingAddress,
      serviceAddress,
      templateId: selectedTemplateId !== "none" ? selectedTemplateId : undefined
    });
  };

  const selectedSalesperson = clientId ? clients.find(c => c.id === clientId) : null;

  return (
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

      {/* Address Selectors */}
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

      {/* Salesperson Display */}
      {selectedSalesperson && (
        <div className="space-y-2">
          <Label>Associated Salesperson</Label>
          <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
            {selectedSalesperson.name} {selectedSalesperson.companyName && `(${selectedSalesperson.companyName})`}
          </div>
        </div>
      )}

      {/* Status */}
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

      {/* Commission Override */}
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

      {/* Notes */}
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

      {/* Template Selection */}
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

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Update Quote
        </Button>
      </div>
    </form>
  );
};
