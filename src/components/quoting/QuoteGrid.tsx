
import { useState } from "react";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { AddQuoteDialog } from "@/components/AddQuoteDialog";
import { EditQuoteDialog } from "@/components/EditQuoteDialog";
import { QuoteEmptyState } from "@/components/QuoteEmptyState";
import { QuoteCard } from "@/components/QuoteCard";
import { Button } from "@/components/ui/button";
import { Plus, Grid, List } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { QuoteTable } from "@/components/QuoteTable";
import { useAgentMapping } from "@/hooks/useAgentMapping";

interface QuoteGridProps {
  quotes: Quote[];
  clients: Client[];
  clientInfos: ClientInfo[];
  isLoading: boolean;
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  onUpdateQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
}

export const QuoteGrid = ({
  quotes,
  clients,
  clientInfos,
  isLoading,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote
}: QuoteGridProps) => {
  const { isAdmin } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const { agentMapping } = useAgentMapping();

  const handleCopyQuote = (quote: Quote) => {
    const quoteCopy = {
      ...quote,
      id: undefined,
      quoteNumber: undefined,
      date: new Date().toISOString().split('T')[0],
      status: 'pending' as const
    };
    delete (quoteCopy as any).id;
    onAddQuote(quoteCopy);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="w-4 h-4 mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4 mr-2" />
            Grid
          </Button>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </Button>
        )}
      </div>

      {quotes.length === 0 ? (
        <QuoteEmptyState />
      ) : viewMode === 'table' ? (
        <QuoteTable
          quotes={quotes}
          clientInfos={clientInfos}
          agentMapping={agentMapping}
          onEditClick={setEditingQuote}
          onDeleteQuote={onDeleteQuote}
          onUpdateQuote={onUpdateQuote}
          onCopyQuote={handleCopyQuote}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onClick={() => setEditingQuote(quote)}
            />
          ))}
        </div>
      )}

      <AddQuoteDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddQuote={onAddQuote}
        clients={clients}
        clientInfos={clientInfos}
      />

      <EditQuoteDialog
        quote={editingQuote}
        open={!!editingQuote}
        onOpenChange={(open) => !open && setEditingQuote(null)}
        onUpdateQuote={onUpdateQuote}
        clients={clients}
        clientInfos={clientInfos}
      />
    </div>
  );
};
