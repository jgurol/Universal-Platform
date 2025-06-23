
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
  console.log('getInitials - Input name:', name);
  
  // If name is empty, loading, or just "Sales Team", show "ST"
  if (!name || name.trim() === '' || name === 'Sales Team' || name === 'Loading...') {
    console.log('getInitials - Using fallback ST for:', name);
    return 'ST';
  }
  
  // Handle email addresses by taking the part before @
  if (name.includes('@')) {
    console.log('getInitials - Processing email:', name);
    const emailName = name.split('@')[0];
    const initials = emailName
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
    console.log('getInitials - Email initials:', initials);
    return initials;
  }
  
  // Handle full names
  console.log('getInitials - Processing full name:', name);
  const nameParts = name.trim().split(/\s+/);
  let initials;
  
  if (nameParts.length >= 2) {
    // Take first letter of first and second names
    initials = nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
    console.log('getInitials - Full name initials (first + last):', initials);
  } else if (nameParts.length === 1) {
    // Single name - take first two characters
    initials = nameParts[0].slice(0, 2).toUpperCase();
    console.log('getInitials - Single name initials:', initials);
  } else {
    initials = 'ST';
    console.log('getInitials - Fallback to ST');
  }
  
  return initials;
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
  const initials = getInitials(salespersonName);

  // Debug logging to see what we're getting
  console.log('QuoteTableCells - Quote ID:', quote.id);
  console.log('QuoteTableCells - Quote user_id:', quote.user_id);
  console.log('QuoteTableCells - Salesperson name:', salespersonName);
  console.log('QuoteTableCells - Generated initials:', initials);

  return (
    <>
      <TableCell className="font-medium">
        <div className="flex items-center">
          <span className="text-sm font-semibold text-gray-700" title={salespersonName}>
            {initials}
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
