
import { useQuoteData } from "./useQuoteData";
import { useClientData } from "./useClientData";
import { useTemplateContent } from "./useTemplateContent";
import { useAcceptanceStatus } from "./useAcceptanceStatus";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QuoteItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  charge_type: 'MRC' | 'NRC';
  item?: {
    name: string;
    description?: string;
  };
}

export const useAcceptQuoteData = (quoteId: string | undefined) => {
  const { quote, isLoading: quoteLoading, error } = useQuoteData(quoteId);
  const { clientInfo, contacts, primaryContact } = useClientData(quote?.clientInfoId);
  const { templateContent, templateLoading } = useTemplateContent(quote?.templateId);
  const { isAccepted, acceptedAt, setIsAccepted, setAcceptedAt } = useAcceptanceStatus(quoteId);
  
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  const fetchQuoteItems = async () => {
    if (!quoteId) return;

    try {
      const { data: quoteItemsData, error: quoteItemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          item:items(
            name,
            description
          )
        `)
        .eq('quote_id', quoteId);

      if (quoteItemsError) {
        console.error('Error fetching quote items:', quoteItemsError);
        return;
      }

      if (quoteItemsData) {
        const mappedItems: QuoteItem[] = quoteItemsData.map((quoteItem: any) => ({
          id: quoteItem.id,
          quantity: quoteItem.quantity || 1,
          unit_price: parseFloat(quoteItem.unit_price) || 0,
          total_price: parseFloat(quoteItem.total_price) || 0,
          charge_type: (quoteItem.charge_type as 'MRC' | 'NRC') || 'NRC',
          item: quoteItem.item
        }));
        
        setQuoteItems(mappedItems);
      }
    } catch (err) {
      console.error('Error fetching quote items:', err);
    }
  };

  useEffect(() => {
    fetchQuoteItems();
  }, [quoteId]);

  // Overall loading state - true if quote is still loading
  const isLoading = quoteLoading;

  return {
    quote,
    quoteItems,
    clientInfo,
    contacts,
    primaryContact,
    isLoading,
    isAccepted,
    error,
    acceptedAt,
    templateContent,
    templateLoading,
    setIsAccepted,
    setAcceptedAt
  };
};
