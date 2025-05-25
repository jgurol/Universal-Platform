
import { Quote, ClientInfo } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAgentMapping } from "@/hooks/useAgentMapping";

interface QuoteTableProps {
  quotes: Quote[];
  clientInfos: ClientInfo[];
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
}

export const QuoteTable = ({
  quotes,
  clientInfos,
  onEditClick,
  onDeleteQuote
}: QuoteTableProps) => {
  const { isAdmin } = useAuth();
  const { agentMapping } = useAgentMapping();

  const handleDeleteQuote = (quoteId: string) => {
    if (onDeleteQuote) {
      onDeleteQuote(quoteId);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusColors = {
      approved: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      rejected: 'bg-red-50 text-red-700 border-red-200'
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${statusColors[status as keyof typeof statusColors] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Helper functions to calculate MRC and NRC totals
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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold">Salesperson</TableHead>
            <TableHead className="font-semibold">Quote Number</TableHead>
            <TableHead className="font-semibold">Customer Name</TableHead>
            <TableHead className="font-semibold">Quote Name</TableHead>
            <TableHead className="font-semibold text-right">Total NRC</TableHead>
            <TableHead className="font-semibold text-right">Total MRC</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            {isAdmin && <TableHead className="font-semibold text-center">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => {
            const clientInfo = clientInfos.find(ci => ci.id === quote.clientInfoId);
            const salespersonName = agentMapping[quote.clientId] || quote.clientName;
            const mrcTotal = getMRCTotal(quote);
            const nrcTotal = getNRCTotal(quote);
            
            return (
              <TableRow key={quote.id} className="hover:bg-gray-50">
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
                  {getStatusBadge(quote.status)}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      {onEditClick && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          onClick={() => onEditClick(quote)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {onDeleteQuote && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          onClick={() => handleDeleteQuote(quote.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
