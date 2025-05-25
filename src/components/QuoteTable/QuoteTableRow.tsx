
import { useState } from "react";
import { Quote, ClientInfo } from "@/pages/Index";
import { TableCell, TableRow } from "@/components/ui/table";
import { EmailQuoteDialog } from "@/components/EmailQuoteDialog";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { QuoteActions } from "./QuoteActions";

interface QuoteTableRowProps {
  quote: Quote;
  clientInfos: ClientInfo[];
  agentMapping: Record<string, string>;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onCopyQuote?: (quote: Quote) => void;
}

export const QuoteTableRow = ({
  quote,
  clientInfos,
  agentMapping,
  onEditClick,
  onDeleteQuote,
  onUpdateQuote,
  onCopyQuote
}: QuoteTableRowProps) => {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const clientInfo = clientInfos.find(ci => ci.id === quote.clientInfoId);
  const salespersonName = agentMapping[quote.clientId] || quote.clientName;

  const getMRCTotal = (quote: Quote) => {
    if (!quote.quoteItems || quote.quoteItems.length === 0) {
      return 0;
    }
    return quote.quoteItems
      .filter(item => item.charge_type === 'MRC')
      .reduce((total, item) => total + (Number(item.total_price) || 0), 0);
  };

  const getNRCTotal = (quote: Quote) => {
    if (!quote.quoteItems || quote.quoteItems.length === 0) {
      return 0;
    }
    return quote.quoteItems
      .filter(item => item.charge_type === 'NRC')
      .reduce((total, item) => total + (Number(item.total_price) || 0), 0);
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (onUpdateQuote) {
      onUpdateQuote({
        ...quote,
        status: newStatus
      });
    }
  };

  const mrcTotal = getMRCTotal(quote);
  const nrcTotal = getNRCTotal(quote);

  return (
    <>
      <TableRow className="hover:bg-gray-50">
        <TableCell className="font-medium">
          {salespersonName}
        </TableCell>
        <TableCell>
          <div className="font-mono text-sm">
            {quote.quoteNumber || `Q-${quote.id.slice(0, 8)}`}
          </div>
        </TableCell>
        <TableCell>
          {clientInfo?.company_name || 'N/A'}
        </TableCell>
        <TableCell>
          <div className="max-w-xs truncate" title={quote.description}>
            {quote.description || 'Untitled Quote'}
          </div>
        </TableCell>
        <TableCell className="text-right font-mono">
          ${nrcTotal.toLocaleString()}
        </TableCell>
        <TableCell className="text-right font-mono">
          ${mrcTotal.toLocaleString()}
        </TableCell>
        <TableCell>
          <QuoteStatusBadge
            quoteId={quote.id}
            status={quote.status || 'pending'}
            onStatusUpdate={handleStatusUpdate}
          />
        </TableCell>
        <TableCell className="text-center">
          <QuoteActions
            quote={quote}
            clientInfo={clientInfo}
            salespersonName={salespersonName}
            onEditClick={onEditClick}
            onDeleteQuote={onDeleteQuote}
            onCopyQuote={onCopyQuote}
            onEmailClick={() => setIsEmailDialogOpen(true)}
          />
        </TableCell>
      </TableRow>

      <EmailQuoteDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        quote={quote}
        clientInfo={clientInfo}
        salespersonName={salespersonName}
      />
    </>
  );
};
