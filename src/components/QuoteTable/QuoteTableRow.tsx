
import { useState } from "react";
import { Quote, ClientInfo } from "@/pages/Index";
import { TableRow } from "@/components/ui/table";
import { EmailQuoteDialog } from "@/components/EmailQuoteDialog";
import { QuoteTableCells } from "./QuoteTableCells";

interface QuoteTableRowProps {
  quote: Quote;
  clientInfos: ClientInfo[];
  agentMapping: Record<string, string>;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onCopyQuote?: (quote: Quote) => void;
  onUnarchiveQuote?: (quoteId: string) => void;
}

export const QuoteTableRow = ({
  quote,
  clientInfos,
  agentMapping,
  onEditClick,
  onDeleteQuote,
  onUpdateQuote,
  onCopyQuote,
  onUnarchiveQuote
}: QuoteTableRowProps) => {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  // Use the pre-fetched salesperson name from the quote object
  const quoteOwnerName = quote.salespersonName || 'Sales Team';

  const clientInfo = clientInfos.find(ci => ci.id === quote.clientInfoId);

  const handleStatusUpdate = (newStatus: string) => {
    if (onUpdateQuote) {
      onUpdateQuote({
        ...quote,
        status: newStatus
      });
    }
  };

  console.log('QuoteTableRow - Using pre-fetched salesperson name:', quoteOwnerName);

  return (
    <>
      <TableRow className="hover:bg-gray-50">
        <QuoteTableCells
          quote={quote}
          clientInfo={clientInfo}
          salespersonName={quoteOwnerName}
          onEditClick={onEditClick}
          onDeleteQuote={onDeleteQuote}
          onCopyQuote={onCopyQuote}
          onEmailClick={() => setIsEmailDialogOpen(true)}
          onStatusUpdate={handleStatusUpdate}
          onUnarchiveQuote={onUnarchiveQuote}
        />
      </TableRow>

      <EmailQuoteDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        quote={quote}
        clientInfo={clientInfo}
        salespersonName={quoteOwnerName}
      />
    </>
  );
};
