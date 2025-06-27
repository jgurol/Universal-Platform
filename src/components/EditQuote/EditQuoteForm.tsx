
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EditQuoteFormFields } from "./EditQuoteFormFields";
import { EditQuoteHeader } from "./EditQuoteHeader";
import { EditQuoteAddressSection } from "./EditQuoteAddressSection";
import { EditQuoteTemplateSection } from "./EditQuoteTemplateSection";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { Quote, ClientInfo } from "@/pages/Index";
import { QuoteItemData } from "@/types/quoteItems";
import { useQuoteForm } from "@/hooks/useQuoteForm";

interface EditQuoteFormProps {
  quote: Quote;
  clientInfo: ClientInfo;
  onSave: (updatedQuote: Partial<Quote>, items: QuoteItemData[]) => void;
  onCancel: () => void;
}

export const EditQuoteForm = ({ quote, clientInfo, onSave, onCancel }: EditQuoteFormProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<QuoteItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [selectedServiceAddressId, setSelectedServiceAddressId] = useState<string | null>(null);

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
    quoteMonth,
    setQuoteMonth,
    quoteYear,
    setQuoteYear,
    status,
    setStatus,
    expiresAt,
    setExpiresAt,
    notes,
    setNotes,
    commissionOverride,
    setCommissionOverride
  } = useQuoteForm(quote, true);

  // Initialize form data from quote
  useEffect(() => {
    if (quote) {
      setSelectedTemplateId(quote.templateId || "");
      setSelectedBillingAddressId(quote.billingAddress || null);
      setSelectedServiceAddressId(quote.serviceAddress || null);
    }
  }, [quote]);

  // Simple form validation
  const isFormValid = () => {
    return description && clientInfoId && selectedTemplateId && items.length > 0;
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      toast({
        title: "Form Invalid",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedQuote = {
        clientId,
        clientInfoId,
        date,
        description,
        quoteNumber,
        quoteMonth,
        quoteYear,
        status,
        expiresAt,
        notes,
        commissionOverride: commissionOverride ? parseFloat(commissionOverride) : undefined,
        templateId: selectedTemplateId,
        billingAddress: selectedBillingAddressId,
        serviceAddress: selectedServiceAddressId,
        items
      };
      
      await onSave(updatedQuote, items);
      
      toast({
        title: "Quote Updated",
        description: "Quote has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating quote:', error);
      toast({
        title: "Error",
        description: "Failed to update quote",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBillingAddressChange = (addressId: string | null, customAddr?: string) => {
    setSelectedBillingAddressId(addressId);
  };

  const handleServiceAddressChange = (addressId: string | null, customAddr?: string) => {
    setSelectedServiceAddressId(addressId);
  };

  return (
    <div className="space-y-6">
      <EditQuoteHeader
        quoteNumber={quoteNumber}
        onQuoteNumberChange={setQuoteNumber}
        date={date}
        onDateChange={setDate}
        expiresAt={expiresAt}
        onExpiresAtChange={setExpiresAt}
      />
      
      <EditQuoteFormFields
        description={description}
        onDescriptionChange={setDescription}
        clientInfoId={clientInfoId}
        onClientInfoIdChange={setClientInfoId}
        clientInfos={[clientInfo]}
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

      <QuoteItemsManager
        items={items}
        onItemsChange={setItems}
        clientInfoId={clientInfoId}
      />

      <EditQuoteTemplateSection
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={setSelectedTemplateId}
        templates={[]}
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!isFormValid() || isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Updating..." : "Update Quote"}
        </Button>
      </div>
    </div>
  );
};
