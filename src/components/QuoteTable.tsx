
import { Quote, ClientInfo } from "@/pages/Index";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAgentMapping } from "@/hooks/useAgentMapping";
import { useState } from "react";
import { QuoteTableHeader } from "./QuoteTable/QuoteTableHeader";
import { QuoteTableRow } from "./QuoteTable/QuoteTableRow";

interface QuoteTableProps {
  quotes: Quote[];
  clientInfos: ClientInfo[];
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onCopyQuote?: (quote: Quote) => void;
  onUnarchiveQuote?: (quoteId: string) => void;
}

type SortField = 'salesperson' | 'quoteNumber' | 'customerName' | 'status';
type SortDirection = 'asc' | 'desc';

export const QuoteTable = ({
  quotes,
  clientInfos,
  onEditClick,
  onDeleteQuote,
  onUpdateQuote,
  onCopyQuote,
  onUnarchiveQuote
}: QuoteTableProps) => {
  const { agentMapping } = useAgentMapping();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (!sortField) return 0;

    let aValue: string;
    let bValue: string;

    switch (sortField) {
      case 'salesperson':
        aValue = agentMapping[a.clientId] || a.clientName || '';
        bValue = agentMapping[b.clientId] || b.clientName || '';
        break;
      case 'quoteNumber':
        aValue = a.quoteNumber || `Q-${a.id.slice(0, 8)}`;
        bValue = b.quoteNumber || `Q-${b.id.slice(0, 8)}`;
        break;
      case 'customerName':
        aValue = clientInfos.find(ci => ci.id === a.clientInfoId)?.company_name || '';
        bValue = clientInfos.find(ci => ci.id === b.clientInfoId)?.company_name || '';
        break;
      case 'status':
        aValue = a.status || 'pending';
        bValue = b.status || 'pending';
        break;
      default:
        return 0;
    }

    const comparison = aValue.localeCompare(bValue);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <QuoteTableHeader
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedQuotes.map((quote) => (
            <QuoteTableRow
              key={quote.id}
              quote={quote}
              clientInfos={clientInfos}
              agentMapping={agentMapping}
              onEditClick={onEditClick}
              onDeleteQuote={onDeleteQuote}
              onUpdateQuote={onUpdateQuote}
              onCopyQuote={onCopyQuote}
              onUnarchiveQuote={onUnarchiveQuote}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
