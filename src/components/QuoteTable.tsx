import { Quote, ClientInfo } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, ChevronDown, ChevronUp, ArrowUpDown, FileText, Copy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAgentMapping } from "@/hooks/useAgentMapping";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateQuotePDF } from "@/utils/pdfUtils";

interface QuoteTableProps {
  quotes: Quote[];
  clientInfos: ClientInfo[];
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onCopyQuote?: (quote: Quote) => void;
}

type SortField = 'salesperson' | 'quoteNumber' | 'customerName' | 'status';
type SortDirection = 'asc' | 'desc';

export const QuoteTable = ({
  quotes,
  clientInfos,
  onEditClick,
  onDeleteQuote,
  onUpdateQuote,
  onCopyQuote
}: QuoteTableProps) => {
  const { isAdmin } = useAuth();
  const { agentMapping } = useAgentMapping();
  const { toast } = useToast();
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

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
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

  const handleDeleteQuote = (quoteId: string) => {
    if (onDeleteQuote) {
      onDeleteQuote(quoteId);
    }
  };

  const handleStatusChange = async (quote: Quote, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', quote.id);

      if (error) {
        console.error('Error updating quote status:', error);
        toast({
          title: "Failed to update status",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Update the quote locally if onUpdateQuote is provided
      if (onUpdateQuote) {
        onUpdateQuote({
          ...quote,
          status: newStatus
        });
      }

      toast({
        title: "Status updated",
        description: `Quote status changed to ${newStatus}`,
      });
    } catch (err) {
      console.error('Error updating quote status:', err);
      toast({
        title: "Error",
        description: "Failed to update quote status",
        variant: "destructive"
      });
    }
  };

  const handleCopyQuote = (quote: Quote) => {
    if (onCopyQuote) {
      onCopyQuote(quote);
    }
  };

  const getStatusBadge = (quote: Quote) => {
    const status = quote.status || 'pending';
    
    const statusColors = {
      approved: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      rejected: 'bg-red-50 text-red-700 border-red-200'
    };

    const badgeClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-50 text-gray-700 border-gray-200';

    if (isAdmin) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
              <Badge 
                variant="outline" 
                className={`text-xs cursor-pointer hover:opacity-80 flex items-center gap-1 ${badgeClass}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <ChevronDown className="w-3 h-3" />
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border shadow-md">
            <DropdownMenuItem 
              onClick={() => handleStatusChange(quote, 'pending')}
              className="cursor-pointer hover:bg-gray-50"
            >
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange(quote, 'approved')}
              className="cursor-pointer hover:bg-gray-50"
            >
              Approved
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange(quote, 'rejected')}
              className="cursor-pointer hover:bg-gray-50"
            >
              Rejected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${badgeClass}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handlePreviewPDF = (quote: Quote) => {
    try {
      const clientInfo = clientInfos.find(ci => ci.id === quote.clientInfoId);
      const salespersonName = agentMapping[quote.clientId] || quote.clientName;
      
      const pdf = generateQuotePDF(quote, clientInfo, salespersonName);
      
      // Open PDF in new window/tab
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast({
        title: "PDF Generated",
        description: "Quote PDF has been opened in a new tab",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF preview",
        variant: "destructive"
      });
    }
  };

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
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                className="h-auto p-0 font-semibold text-left hover:bg-transparent flex items-center"
                onClick={() => handleSort('salesperson')}
              >
                Salesperson
                {getSortIcon('salesperson')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                className="h-auto p-0 font-semibold text-left hover:bg-transparent flex items-center"
                onClick={() => handleSort('quoteNumber')}
              >
                Quote Number
                {getSortIcon('quoteNumber')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                className="h-auto p-0 font-semibold text-left hover:bg-transparent flex items-center"
                onClick={() => handleSort('customerName')}
              >
                Customer Name
                {getSortIcon('customerName')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Quote Name</TableHead>
            <TableHead className="font-semibold text-right">Total NRC</TableHead>
            <TableHead className="font-semibold text-right">Total MRC</TableHead>
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                className="h-auto p-0 font-semibold text-left hover:bg-transparent flex items-center"
                onClick={() => handleSort('status')}
              >
                Status
                {getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedQuotes.map((quote) => {
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
                  {getStatusBadge(quote)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-1 justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                      onClick={() => handlePreviewPDF(quote)}
                      title="Preview PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    {isAdmin && onCopyQuote && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                        onClick={() => handleCopyQuote(quote)}
                        title="Copy Quote"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                    {isAdmin && onEditClick && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                        onClick={() => onEditClick(quote)}
                        title="Edit Quote"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {isAdmin && onDeleteQuote && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        onClick={() => handleDeleteQuote(quote.id)}
                        title="Delete Quote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
