
import { useQuoteData } from "./useQuoteData";
import { useClientData } from "./useClientData";
import { useTemplateContent } from "./useTemplateContent";
import { useAcceptanceStatus } from "./useAcceptanceStatus";
import { useQuoteItems } from "./useQuoteItems";

export const useAcceptQuoteData = (quoteId: string | undefined) => {
  const { quote, isLoading: quoteLoading, error } = useQuoteData(quoteId);
  const { clientInfo, contacts, primaryContact } = useClientData(quote?.clientInfoId);
  const { templateContent, templateLoading } = useTemplateContent(quote?.templateId);
  const { isAccepted, acceptedAt, setIsAccepted, setAcceptedAt } = useAcceptanceStatus(quoteId);
  const { quoteItems } = useQuoteItems(quoteId);

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
