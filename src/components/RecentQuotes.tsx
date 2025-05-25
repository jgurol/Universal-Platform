
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { AddQuoteDialog } from "@/components/AddQuoteDialog";
import { EditQuoteDialog } from "@/components/EditQuoteDialog";
import { QuoteHeader } from "@/components/QuoteHeader";
import { QuoteTable } from "@/components/QuoteTable";
import { QuoteEmptyState } from "@/components/QuoteEmptyState";
import { useAuth } from "@/context/AuthContext";

interface RecentQuotesProps {
  quotes: Quote[];
  clients: Client[];
  clientInfos: ClientInfo[];
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  onUpdateQuote: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  associatedAgentId?: string | null;
}

export const RecentQuotes = ({ 
  quotes, 
  clients, 
  clientInfos,
  onAddQuote, 
  onUpdateQuote,
  onDeleteQuote,
  associatedAgentId
}: RecentQuotesProps) => {
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [isEditQuoteOpen, setIsEditQuoteOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const { isAdmin } = useAuth();

  // Function to handle editing a quote - only for admins
  const handleEditClick = (quote: Quote) => {
    if (!isAdmin) return;
    setCurrentQuote(quote);
    setIsEditQuoteOpen(true);
  };

  return (
    <>
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <QuoteHeader
            quoteCount={quotes?.length || 0}
            onAddQuote={() => setIsAddQuoteOpen(true)}
          />
        </CardHeader>
        <CardContent className="p-0">
          {!quotes || quotes.length === 0 ? (
            <div className="p-6">
              <QuoteEmptyState associatedAgentId={associatedAgentId} />
            </div>
          ) : (
            <QuoteTable
              quotes={quotes}
              clientInfos={clientInfos}
              onEditClick={isAdmin ? handleEditClick : undefined}
              onDeleteQuote={onDeleteQuote}
              onUpdateQuote={onUpdateQuote}
            />
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <AddQuoteDialog
            open={isAddQuoteOpen}
            onOpenChange={setIsAddQuoteOpen}
            onAddQuote={onAddQuote}
            clients={clients}
            clientInfos={clientInfos}
          />

          <EditQuoteDialog
            quote={currentQuote}
            open={isEditQuoteOpen}
            onOpenChange={setIsEditQuoteOpen}
            onUpdateQuote={onUpdateQuote}
            clients={clients}
            clientInfos={clientInfos}
          />
        </>
      )}
    </>
  );
};
