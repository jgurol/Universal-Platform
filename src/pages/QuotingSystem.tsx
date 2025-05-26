
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { QuoteManagementHeader } from "@/components/quoting/QuoteManagementHeader";
import { QuoteFilters } from "@/components/quoting/QuoteFilters";
import { QuoteGrid } from "@/components/quoting/QuoteGrid";
import { QuoteStats } from "@/components/quoting/QuoteStats";
import { useQuotes } from "@/hooks/useQuotes";
import { useClients } from "@/hooks/useClients";
import { useClientInfos } from "@/hooks/useClientInfos";

export default function QuotingSystem() {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const { 
    quotes, 
    isLoading: quotesLoading, 
    addQuote, 
    updateQuote, 
    deleteQuote 
  } = useQuotes(user?.id);
  
  const { clients } = useClients(user?.id);
  const { clientInfos } = useClientInfos(user?.id);

  // Filter quotes based on search and filters
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = searchTerm === "" || 
      quote.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;

    const matchesDateRange = !dateRange.from || !dateRange.to || 
      (new Date(quote.date) >= dateRange.from && new Date(quote.date) <= dateRange.to);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <QuoteManagementHeader />
      
      <div className="space-y-6">
        <QuoteStats quotes={quotes} />
        
        <QuoteFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <QuoteGrid
          quotes={filteredQuotes}
          clients={clients}
          clientInfos={clientInfos}
          isLoading={quotesLoading}
          onAddQuote={addQuote}
          onUpdateQuote={updateQuote}
          onDeleteQuote={deleteQuote}
        />
      </div>
    </div>
  );
}
