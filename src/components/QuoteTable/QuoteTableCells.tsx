
import { Quote, ClientInfo } from "@/pages/Index";
import { TableCell } from "@/components/ui/table";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
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
  onUnarchiveQuote?: (quoteId: string) => void;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
};

export const QuoteTableCells = ({
  quote,
  clientInfo,
  salespersonName,
  onEditClick,
  onDeleteQuote,
  onCopyQuote,
  onEmailClick,
  onStatusUpdate,
  onUnarchiveQuote
}: QuoteTableCellsProps) => {
  const mrcTotal = getMRCTotal(quote);
  const nrcTotal = getNRCTotal(quote);
  const approvedDate = formatDate(quote.acceptedAt);

  return (
    <>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <span className="text-sm font-semibold text-gray-700" title={salespersonName}>
            {getInitials(salespersonName)}
          </span>
        </div>
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
        <div className="flex flex-col gap-1">
          <QuoteStatusBadge
            quoteId={quote.id}
            status={quote.status || 'pending'}
            onStatusUpdate={onStatusUpdate}
          />
          {approvedDate && (
            <span className="text-xs text-gray-500">
              {approvedDate}
            </span>
          )}
        </div>
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
          onUnarchiveQuote={onUnarchiveQuote}
        />
      </TableCell>
    </>
  );
};
