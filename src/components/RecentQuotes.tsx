
import React, { useState } from "react";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { QuoteCard } from "@/components/QuoteCard";
import { AddQuoteDialog } from "@/components/AddQuoteDialog";
import { EditQuoteDialog } from "@/components/EditQuoteDialog";
import { ApprovalWarningDialog } from "@/components/ApprovalWarningDialog";
import { SignatureDialog } from "@/components/SignatureDialog";
import { useSignatureWorkflow } from "@/hooks/useSignatureWorkflow";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface RecentQuotesProps {
  quotes: Quote[];
  clients: Client[];
  clientInfos: ClientInfo[];
  onAddQuote: (quote: Omit<Quote, "id">) => Promise<void>;
  onUpdateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  onDeleteQuote: (id: string) => Promise<void>;
  associatedAgentId: string | null;
}

export const RecentQuotes = ({
  quotes,
  clients,
  clientInfos,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  associatedAgentId,
}: RecentQuotesProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);

  const {
    isSignatureDialogOpen,
    setIsSignatureDialogOpen,
    currentQuote,
    currentClientInfo,
    initiateSignature,
    handleSignatureComplete
  } = useSignatureWorkflow();

  const handleEdit = (id: string) => {
    const quote = quotes.find(q => q.id === id);
    if (quote) {
      setEditingQuote(quote);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingQuoteId(id);
  };

  const confirmDelete = async () => {
    if (deletingQuoteId) {
      await onDeleteQuote(deletingQuoteId);
      setDeletingQuoteId(null);
    }
  };

  const handleUpdateQuote = async (updatedQuote: Quote) => {
    await onUpdateQuote(updatedQuote.id, updatedQuote);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Recent Quotes</h2>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Quote
        </Button>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No quotes found</p>
          <p className="text-gray-400">Create your first quote to get started</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              clients={clients}
              clientInfos={clientInfos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onInitiateSignature={initiateSignature}
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
        associatedAgentId={associatedAgentId}
      />

      {editingQuote && (
        <EditQuoteDialog
          open={!!editingQuote}
          onOpenChange={(open) => !open && setEditingQuote(null)}
          quote={editingQuote}
          onUpdateQuote={handleUpdateQuote}
          clients={clients}
          clientInfos={clientInfos}
        />
      )}

      <ApprovalWarningDialog
        open={!!deletingQuoteId}
        onOpenChange={(open) => !open && setDeletingQuoteId(null)}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingQuoteId(null)}
      />

      <SignatureDialog
        open={isSignatureDialogOpen}
        onOpenChange={setIsSignatureDialogOpen}
        quote={currentQuote!}
        clientInfo={currentClientInfo}
        onSignatureComplete={handleSignatureComplete}
      />
    </div>
  );
};
