
import { useState, useEffect } from "react";
import { Quote } from "@/pages/Index";
import { QuoteItemData } from "@/types/quoteItems";
import { fetchQuoteItems } from "@/services/quoteItemsService";

export const useQuoteItems = (quote: Quote | null, open: boolean) => {
  const [quoteItems, setQuoteItems] = useState<QuoteItemData[]>([]);

  useEffect(() => {
    if (quote && open) {
      const loadQuoteItems = async () => {
        const items = await fetchQuoteItems(quote.id);
        setQuoteItems(items);
      };
      loadQuoteItems();
    }
  }, [quote, open]);

  return {
    quoteItems,
    setQuoteItems
  };
};
