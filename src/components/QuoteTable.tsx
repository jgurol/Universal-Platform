
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
  const [sortField, setSortField] = useState<SortField>('quoteNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'quoteNumber' ? 'desc' : 'asc');
    }
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
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
        // For quote numbers, we want to sort numerically if they're numeric
        const aNum = parseInt(aValue.replace(/\D/g, '')) || 0;
        const bNum = parseInt(bValue.replace(/\D/g, '')) || 0;
        const comparison = aNum - bNum;
        return sortDirection === 'asc' ? comparison : -comparison;
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

    // For non-quote number fields, use string comparison
    const stringComparison = aValue.localeCompare(bValue);
    return sortDirection === 'asc' ? stringComparison : -stringComparison;
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
