import { useState } from "react";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuoteTableHeader } from "./QuoteTable/QuoteTableHeader";
import { QuoteTableRow } from "./QuoteTable/QuoteTableRow";
import { Quote, Client, ClientInfo } from "@/types/index";

type SortField = 'salesperson' | 'quoteNumber' | 'customerName' | 'status';
type SortDirection = 'asc' | 'desc';

interface QuoteTableProps {
  quotes: Quote[];
  clients?: Client[];
  clientInfos: ClientInfo[];
  onEditQuote?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onUnarchiveQuote?: (quoteId: string) => void;
  onEmailQuote?: (quote: Quote) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onCopyQuote?: (quote: Quote) => void;
  showArchived?: boolean;
}

export const QuoteTable = ({ 
  quotes, 
  clients = [], 
  clientInfos, 
  onEditQuote, 
  onDeleteQuote,
  onUnarchiveQuote,
  onEmailQuote,
  onUpdateQuote,
  onCopyQuote,
  showArchived = false
}: QuoteTableProps) => {
  const [sortField, setSortField] = useState<SortField>('quoteNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Create agent mapping from clients array - ensure clients is always an array
  const agentMapping = (clients || []).reduce((acc, client) => {
    acc[client.id] = client.name;
    return acc;
  }, {} as Record<string, string>);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'salesperson':
        const aClient = clients.find(c => c.id === a.clientId);
        const bClient = clients.find(c => c.id === b.clientId);
        aValue = aClient?.name || '';
        bValue = bClient?.name || '';
        break;
      case 'quoteNumber':
        aValue = a.quoteNumber || '';
        bValue = b.quoteNumber || '';
        break;
      case 'customerName':
        const aClientInfo = clientInfos.find(ci => ci.id === a.clientInfoId);
        const bClientInfo = clientInfos.find(ci => ci.id === b.clientInfoId);
        aValue = aClientInfo?.company_name || '';
        bValue = bClientInfo?.company_name || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      default:
        aValue = '';
        bValue = '';
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Filter based on whether we're showing archived quotes
  const filteredQuotes = sortedQuotes.filter(quote => 
    showArchived ? quote.status === 'archived' : quote.status !== 'archived'
  );

  if (filteredQuotes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {showArchived ? 'No archived quotes found.' : 'No quotes found.'}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
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
          {filteredQuotes.map((quote) => (
            <QuoteTableRow
              key={quote.id}
              quote={quote}
              clientInfos={clientInfos}
              agentMapping={agentMapping}
              onEditClick={onEditQuote}
              onDeleteQuote={onDeleteQuote}
              onUnarchiveQuote={onUnarchiveQuote}
              onUpdateQuote={onUpdateQuote}
              onCopyQuote={onCopyQuote}
            />
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
