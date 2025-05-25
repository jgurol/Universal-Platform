
import { IndexPageLayout } from "@/components/IndexPageLayout";
import { useIndexData } from "@/hooks/useIndexData";
import { useQuoteActions } from "@/hooks/useQuoteActions";
import { useClientActions } from "@/hooks/useClientActions";

// Define the Client type (for agents)
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  companyName: string | null;
  commissionRate: number;
  totalEarnings: number;
  lastPayment: string;
}

// Define the Quote type (replacing Transaction)
export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  companyName: string;
  amount: number;
  date: string;
  description: string;
  quoteNumber?: string;
  quoteMonth?: string;
  quoteYear?: string;
  status?: string;
  commission?: number;
  clientInfoId?: string;
  clientCompanyName?: string;
  commissionOverride?: number;
  expiresAt?: string;
  notes?: string;
  quoteItems?: any[];
  billingAddress?: string;
  serviceAddress?: string;
  templateId?: string;
}

// Define the Transaction type for backward compatibility - maps to Quote
export interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  companyName: string;
  amount: number;
  date: string;
  description: string;
  invoiceNumber?: string;
  invoiceMonth?: string;
  invoiceYear?: string;
  isPaid?: boolean;
  commission?: number;
  clientInfoId?: string;
  clientCompanyName?: string;
  commissionOverride?: number;
  datePaid?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  isApproved?: boolean;
  commissionPaidDate?: string;
}

// Define the ClientInfo type
export interface ClientInfo {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  revio_id: string | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
  commission_override?: number | null;
}

const Index = () => {
  const {
    clients,
    setClients,
    quotes,
    setQuotes,
    clientInfos,
    setClientInfos,
    isLoading,
    associatedAgentId,
    fetchClients,
    fetchQuotes,
    fetchClientInfos
  } = useIndexData();

  const {
    addQuote,
    updateQuote,
    deleteQuote
  } = useQuoteActions(clients, fetchQuotes);

  const { addClient } = useClientActions(clients, setClients, fetchClients);

  // Create a wrapper function that matches the expected signature
  const handleUpdateQuote = (quote: Quote) => {
    updateQuote(quote.id, quote);
  };

  return (
    <IndexPageLayout
      clients={clients}
      quotes={quotes}
      clientInfos={clientInfos}
      associatedAgentId={associatedAgentId}
      onAddClient={addClient}
      onAddQuote={addQuote}
      onUpdateQuote={handleUpdateQuote}
      onDeleteQuote={deleteQuote}
      onFetchClients={fetchClients}
    />
  );
};

export default Index;
