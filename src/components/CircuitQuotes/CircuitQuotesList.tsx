import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { CircuitQuoteCard } from "@/components/CircuitQuoteCard";
import { CircuitQuote, CarrierQuote } from "@/hooks/useCircuitQuotes";
import { useAuth } from "@/context/AuthContext";

interface CircuitQuotesListProps {
  quotes: CircuitQuote[];
  onUpdateQuote: (quote: any) => void;
  onAddCarrier: (quoteId: string, carrierData: any) => void;
  onUpdateCarrier: (carrierData: any) => void;
  onDeleteCarrier: (carrierId: string) => void;
  onDeleteQuote: (quoteId: string) => void;
  onAddQuote: () => void;
  searchTerm: string;
  statusFilter: string;
}

export const CircuitQuotesList = ({
  quotes,
  onUpdateQuote,
  onAddCarrier,
  onUpdateCarrier,
  onDeleteCarrier,
  onDeleteQuote,
  onAddQuote,
  searchTerm,
  statusFilter
}: CircuitQuotesListProps) => {
  const { isAdmin } = useAuth();

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For admins showing "all", include all quotes including "sent_to_customer"
    // For non-admins showing "all", exclude "sent_to_customer" quotes
    const matchesStatus = statusFilter === "all" 
      ? (isAdmin ? true : quote.status !== 'sent_to_customer')
      : quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (filteredQuotes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No circuit quotes found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Get started by creating your first circuit quote to research carrier pricing"}
          </p>
          <Button onClick={onAddQuote} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Circuit Quote
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredQuotes.map((quote) => (
        <CircuitQuoteCard
          key={quote.id}
          quote={{
            ...quote,
            client: quote.client_name,
            creationDate: quote.created_at
          }}
          onUpdate={onUpdateQuote}
          onAddCarrier={(carrierData) => onAddCarrier(quote.id, carrierData)}
          onUpdateCarrier={onUpdateCarrier}
          onDeleteCarrier={onDeleteCarrier}
          onDeleteQuote={onDeleteQuote}
        />
      ))}
    </div>
  );
};
