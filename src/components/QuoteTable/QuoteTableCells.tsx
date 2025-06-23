
import { TableCell } from "@/components/ui/table";
import { Quote, ClientInfo } from "@/types/index";
import { QuoteActions } from "./QuoteActions";
import { formatDateForDisplay } from "@/utils/dateUtils";

interface QuoteTableCellsProps {
  quote: Quote;
  clientInfo?: ClientInfo | null;
  salespersonName: string;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onCopyQuote?: (quote: Quote) => void;
  onEmailClick?: () => void;
  onStatusUpdate?: (newStatus: string) => void;
  onUnarchiveQuote?: (quoteId: string) => void;
}

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
  return (
    <>
      <TableCell className="max-w-[200px] truncate" title={quote.description}>
        {quote.description}
      </TableCell>
      <TableCell>{quote.quoteNumber || "N/A"}</TableCell>
      <TableCell className="max-w-[200px] truncate" title={clientInfo?.company_name || "No Client Company"}>
        {clientInfo?.company_name || "No Client Company"}
      </TableCell>
      <TableCell>{salespersonName || "Sales Team"}</TableCell>
      <TableCell>{quote.status}</TableCell>
      <TableCell>{formatDateForDisplay(quote.date)}</TableCell>
      <TableCell>
        <QuoteActions
          quote={quote}
          onEditClick={onEditClick}
          onDeleteQuote={onDeleteQuote}
          onCopyQuote={onCopyQuote}
          onEmailClick={onEmailClick}
          onStatusUpdate={onStatusUpdate}
          onUnarchiveQuote={onUnarchiveQuote}
        />
      </TableCell>
    </>
  );
};
