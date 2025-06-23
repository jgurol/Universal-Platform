
import { useState } from "react";
import { Quote, ClientInfo } from "@/types/index";
import { QuoteCard } from "@/components/QuoteCard";
import { QuoteTable } from "@/components/QuoteTable";
import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";

interface QuoteGridProps {
  quotes: Quote[];
  clientInfos: ClientInfo[];
  onEditClick: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
  onUpdateQuote: (quote: Quote) => void;
  onCopyQuote: (quote: Quote) => void;
}

export const QuoteGrid = ({
  quotes,
  clientInfos,
  onEditClick,
  onDeleteQuote,
  onUpdateQuote,
  onCopyQuote
}: QuoteGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No quotes found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {quotes.length} Quote{quotes.length !== 1 ? 's' : ''}
        </h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <QuoteTable
          quotes={quotes}
          clientInfos={clientInfos}
          onEditQuote={onEditClick}
          onDeleteQuote={onDeleteQuote}
          onUpdateQuote={onUpdateQuote}
          onCopyQuote={onCopyQuote}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              clientInfos={clientInfos}
              onEditClick={onEditClick}
              onDeleteQuote={onDeleteQuote}
              onCopyQuote={onCopyQuote}
            />
          ))}
        </div>
      )}
    </div>
  );
};
