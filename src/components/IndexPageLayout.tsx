
import { useState } from "react";
import { Header } from "@/components/Header";
import { StatsCards } from "@/components/StatsCards";
import { RecentQuotes } from "@/components/RecentQuotes";
import { CommissionChart } from "@/components/CommissionChart";
import { AgentSummary } from "@/components/AgentSummary";
import { AddClientDialog } from "@/components/AddClientDialog";
import { Client, Quote, ClientInfo } from "@/pages/Index";
import { useAuth } from "@/context/AuthContext";

interface IndexPageLayoutProps {
  clients: Client[];
  quotes: Quote[];
  clientInfos: ClientInfo[];
  associatedAgentId: string | null;
  onAddClient: (client: Omit<Client, "id" | "totalEarnings" | "lastPayment">) => Promise<void>;
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  onUpdateQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
  onFetchClients: () => Promise<void>;
}

export const IndexPageLayout = ({
  clients,
  quotes,
  clientInfos,
  associatedAgentId,
  onAddClient,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  onFetchClients
}: IndexPageLayoutProps) => {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [quoteFilter, setQuoteFilter] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  // Filter quotes based on the selected filter
  const getFilteredQuotes = () => {
    if (!quoteFilter) return quotes;

    switch (quoteFilter) {
      case 'pending':
        return quotes.filter(q => q.status === 'pending');
      
      case 'approved':
        return quotes.filter(q => q.status === 'approved');
      
      case 'expired':
        const today = new Date();
        return quotes.filter(q => q.expiresAt && new Date(q.expiresAt) < today);
      
      case 'active':
        const now = new Date();
        return quotes.filter(q => !q.expiresAt || new Date(q.expiresAt) >= now);
      
      default:
        return quotes;
    }
  };

  const filteredQuotes = getFilteredQuotes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <Header />

        {/* Stats Cards */}
        <StatsCards 
          clients={clients}
          quotes={quotes}
          clientInfos={clientInfos}
          isAdmin={isAdmin}
          associatedAgentId={associatedAgentId}
          onFilterChange={setQuoteFilter}
          activeFilter={quoteFilter}
        />

        {/* Main Content - Quotes taking full width */}
        <div className="space-y-6">
          {/* Quotes Section - Full Width */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Quotes
                {quoteFilter && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    (Filtered by {quoteFilter === 'pending' ? 'Pending Quotes' : 
                                quoteFilter === 'approved' ? 'Approved Quotes' :
                                quoteFilter === 'expired' ? 'Expired Quotes' : 
                                'Active Quotes'})
                  </span>
                )}
              </h2>
              {quoteFilter && (
                <button
                  onClick={() => setQuoteFilter(null)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear Filter
                </button>
              )}
            </div>
            
            <RecentQuotes 
              quotes={filteredQuotes} 
              clients={clients}
              clientInfos={clientInfos}
              onAddQuote={onAddQuote}
              onUpdateQuote={onUpdateQuote}
              onDeleteQuote={onDeleteQuote}
              associatedAgentId={associatedAgentId}
            />
          </div>

          {/* Bottom section with Chart and Agent Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Commission Chart */}
            <div className="lg:col-span-2">
              <CommissionChart 
                quotes={filteredQuotes} 
              />
            </div>

            {/* Agent Summary - moved to bottom */}
            <div>
              <AgentSummary 
                clients={clients} 
                quotes={filteredQuotes}
                allQuotes={quotes}
                isAdmin={isAdmin}
                activeFilter={quoteFilter}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Dialog */}
      {isAdmin && (
        <AddClientDialog 
          open={isAddClientOpen}
          onOpenChange={setIsAddClientOpen}
          onAddClient={onAddClient}
          onFetchClients={onFetchClients}
        />
      )}
    </div>
  );
};
