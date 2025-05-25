
import { Quote, ClientInfo } from "@/pages/Index";
import { TableCell } from "@/components/ui/table";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { AcceptanceStatusBadge } from "./AcceptanceStatusBadge";
import { QuoteActions } from "./QuoteActions";
import { getMRCTotal, getNRCTotal } from "./QuoteTableUtils";

interface QuoteTableCellsProps {
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName: string;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onCopyQuote?: (quote: Quote) => void;
  onEmailClick: () => void;
  onStatusUpdate: (newStatus: string) => void;
}

export const QuoteTableCells = ({
  quote,
  clientInfo,
  salespersonName,
  onEditClick,
  onDeleteQuote,
  onCopyQuote,
  onEmailClick,
  onStatusUpdate
}: QuoteTableCellsProps) => {
  const mrcTotal = getMRCTotal(quote);
  const nrcTotal = getNRCTotal(quote);

  return (
    <>
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
          onStatusUpdate={onStatusUpdate}
        />
      </TableCell>
      <TableCell>
        <AcceptanceStatusBadge
          status={quote.acceptanceStatus}
          acceptedBy={quote.acceptedBy}
          acceptedAt={quote.acceptedAt}
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
          onEmailClick={onEmailClick}
        />
      </TableCell>
    </>
  );
};
