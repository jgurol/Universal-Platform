
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { EditQuoteFormFields } from "./EditQuoteFormFields";
import { EditQuoteHeader } from "./EditQuoteHeader";
import { EditQuoteAddressSection } from "./EditQuoteAddressSection";
import { EditQuoteTemplateSection } from "./EditQuoteTemplateSection";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { Quote } from "@/types/quote";
import { ClientInfo } from "@/types/clientManagement";
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

  const {
    formData,
    setFormData,
    selectedTemplate,
    setSelectedTemplate,
    isFormValid,
    validateForm
  } = useQuoteForm({
    initialQuote: quote,
    initialClientInfo: clientInfo,
    items
  });

  useEffect(() => {
    validateForm();
  }, [formData, items, selectedTemplate, validateForm]);

  const handleSave = async () => {
    if (!isFormValid) {
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
        ...formData,
        template_id: selectedTemplate?.id || null,
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

  return (
    <div className="space-y-6">
      <EditQuoteHeader quote={quote} clientInfo={clientInfo} />
      
      <EditQuoteFormFields
        formData={formData}
        setFormData={setFormData}
      />

      <EditQuoteAddressSection
        formData={formData}
        setFormData={setFormData}
        clientInfo={clientInfo}
      />

      <QuoteItemsManager
        items={items}
        onItemsChange={setItems}
        clientInfoId={clientInfo.id}
        showHeaders={true}
      />

      <EditQuoteTemplateSection
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!isFormValid || isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Updating..." : "Update Quote"}
        </Button>
      </div>
    </div>
  );
};
