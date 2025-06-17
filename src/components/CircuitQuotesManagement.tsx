
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AddCircuitQuoteDialog } from "@/components/AddCircuitQuoteDialog";
import { CircuitQuotesHeader } from "@/components/CircuitQuotes/CircuitQuotesHeader";
import { CircuitQuotesStats } from "@/components/CircuitQuotes/CircuitQuotesStats";
import { CircuitQuotesList } from "@/components/CircuitQuotes/CircuitQuotesList";
import { useCircuitQuotes } from "@/hooks/useCircuitQuotes";

// Re-export interfaces for backward compatibility
export type { CircuitQuote, CarrierQuote } from "@/hooks/useCircuitQuotes";

export const CircuitQuotesManagement = () => {
  const { 
    quotes, 
    loading, 
    addQuote, 
    updateQuote, 
    deleteQuote,
    addCarrierQuote, 
    updateCarrierQuote, 
    deleteCarrierQuote,
    fetchQuotes
  } = useCircuitQuotes();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Add additional fetch after component mounts
  useEffect(() => {
    console.log('[CircuitQuotesManagement] Component mounted, triggering data fetch');
    fetchQuotes();
  }, [fetchQuotes]);

  const handleUpdateQuote = (updatedQuote: any) => {
    // Transform the quote to match database format
    const quoteForUpdate = {
      ...updatedQuote,
      client_name: updatedQuote.client || updatedQuote.client_name,
      created_at: updatedQuote.creationDate || updatedQuote.created_at
    };
    updateQuote(quoteForUpdate);
  };

  const handleAddCarrier = (quoteId: string, carrierData: any) => {
    addCarrierQuote(quoteId, carrierData);
  };

  const handleUpdateCarrier = (carrierData: any) => {
    updateCarrierQuote(carrierData);
  };

  const handleDeleteQuote = (quoteId: string) => {
    deleteQuote(quoteId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading circuit quotes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CircuitQuotesHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddQuote={() => setIsAddDialogOpen(true)}
      />

      <CircuitQuotesStats quotes={quotes} />

      <CircuitQuotesList
        quotes={quotes}
        onUpdateQuote={handleUpdateQuote}
        onAddCarrier={handleAddCarrier}
        onUpdateCarrier={handleUpdateCarrier}
        onDeleteCarrier={deleteCarrierQuote}
        onDeleteQuote={handleDeleteQuote}
        onAddQuote={() => setIsAddDialogOpen(true)}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
      />

      <AddCircuitQuoteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddQuote={addQuote}
      />
    </div>
  );
};
