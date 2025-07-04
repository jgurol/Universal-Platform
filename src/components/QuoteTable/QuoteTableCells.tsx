
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
  onPermanentlyDeleteQuote?: (quoteId: string) => void;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return '';
  }
};

const getInitials = (fullName: string): string => {
  if (!fullName || fullName.trim() === '') return '';
  
  return fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 3); // Limit to 3 initials max
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
  onUnarchiveQuote,
  onPermanentlyDeleteQuote
}: QuoteTableCellsProps) => {
  const mrcTotal = getMRCTotal(quote);
  const nrcTotal = getNRCTotal(quote);
  
  // For approved quotes, show the accepted_at date (when customer accepted)
  // For accepted quotes that aren't approved yet, show acceptance date
  const getStatusDate = () => {
    if (quote.status === 'approved' && quote.acceptedAt) {
      return formatDate(quote.acceptedAt);
    }
    return '';
  };

  const statusDate = getStatusDate();

  // Debug logging to see what we're getting
  console.log('QuoteTableCells - Quote ID:', quote.id);
  console.log('QuoteTableCells - Quote user_id:', quote.user_id);
  console.log('QuoteTableCells - Salesperson name:', salespersonName);

  return (
    <>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <span className="text-sm font-semibold text-gray-700" title={salespersonName}>
            {getInitials(salespersonName) || 'UN'}
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
      <TableCell>
        <div className="text-sm text-gray-600">
          {quote.updated_at ? formatDate(quote.updated_at) : 'N/A'}
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
          {statusDate && (
            <span className="text-xs text-gray-500">
              {statusDate}
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
          onPermanentlyDeleteQuote={onPermanentlyDeleteQuote}
        />
      </TableCell>
    </>
  );
};
