import { useState, useEffect } from "react";
import { Quote, ClientInfo } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, ChevronDown, FileText, Copy, Mail, CheckCircle, XCircle, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EmailQuoteDialog } from "@/components/EmailQuoteDialog";

interface QuoteTableRowProps {
  quote: Quote;
  clientInfos: ClientInfo[];
  agentMapping: Record<string, string>;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onCopyQuote?: (quote: Quote) => void;
}

export const QuoteTableRow = ({
  quote,
  clientInfos,
  agentMapping,
  onEditClick,
  onDeleteQuote,
  onUpdateQuote,
  onCopyQuote
}: QuoteTableRowProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailOpened, setEmailOpened] = useState(false);
  const [emailOpenCount, setEmailOpenCount] = useState(0);

  // Load email status from database when component mounts
  useEffect(() => {
    const loadEmailStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('email_status, email_opened, email_open_count')
          .eq('id', quote.id)
          .single();

        if (!error && data) {
          if (data.email_status) {
            setEmailStatus(data.email_status as 'idle' | 'success' | 'error');
          }
          setEmailOpened(data.email_opened || false);
          setEmailOpenCount(data.email_open_count || 0);
        }
      } catch (err) {
        console.error('Error loading email status:', err);
      }
    };

    loadEmailStatus();
  }, [quote.id]);

  const clientInfo = clientInfos.find(ci => ci.id === quote.clientInfoId);
  const salespersonName = agentMapping[quote.clientId] || quote.clientName;

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

  const handleStatusChange = async (newStatus: string) => {
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

  const handlePreviewPDF = async () => {
    try {
      const pdf = await generateQuotePDF(quote, clientInfo, salespersonName);
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

  const handleEmailSuccess = async () => {
    console.log('Email success - updating database with success status');
    setEmailStatus('success');
    
    // Update email status in database
    try {
      await supabase
        .from('quotes')
        .update({ 
          email_status: 'success',
          email_sent_at: new Date().toISOString()
        })
        .eq('id', quote.id);
    } catch (error) {
      console.error('Error updating email status in database:', error);
    }

    toast({
      title: "Email sent!",
      description: "Quote email has been sent successfully",
    });
  };

  const handleEmailError = async () => {
    console.log('Email error - updating database with error status');
    setEmailStatus('error');
    
    // Update email status in database
    try {
      await supabase
        .from('quotes')
        .update({ 
          email_status: 'error',
          email_sent_at: new Date().toISOString()
        })
        .eq('id', quote.id);
    } catch (error) {
      console.error('Error updating email status in database:', error);
    }

    toast({
      title: "Email failed",
      description: "Failed to send quote email",
      variant: "destructive"
    });
  };

  const getEmailIcon = () => {
    console.log('Current email status:', emailStatus);
    if (emailStatus === 'success') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (emailStatus === 'error') return <XCircle className="w-4 h-4 text-red-600" />;
    return <Mail className="w-4 h-4" />;
  };

  const getEmailButtonClass = () => {
    if (emailStatus === 'success') return 'text-green-600 hover:text-green-700 bg-green-50 border-green-200';
    if (emailStatus === 'error') return 'text-red-600 hover:text-red-700 bg-red-50 border-red-200';
    return 'text-gray-500 hover:text-blue-600';
  };

  const getEmailOpenIndicator = () => {
    if (emailOpened && emailStatus === 'success') {
      return (
        <div className="flex items-center gap-1 text-xs text-blue-600" title={`Email opened ${emailOpenCount} time(s)`}>
          <Eye className="w-3 h-3" />
          {emailOpenCount > 1 && <span>{emailOpenCount}</span>}
        </div>
      );
    }
    return null;
  };

  const getStatusBadge = () => {
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
              onClick={() => handleStatusChange('pending')}
              className="cursor-pointer hover:bg-gray-50"
            >
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange('approved')}
              className="cursor-pointer hover:bg-gray-50"
            >
              Approved
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange('rejected')}
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

  const mrcTotal = getMRCTotal(quote);
  const nrcTotal = getNRCTotal(quote);

  return (
    <>
      <TableRow className="hover:bg-gray-50">
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
          {getStatusBadge()}
        </TableCell>
        <TableCell className="text-center">
          <div className="flex gap-1 justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
              onClick={handlePreviewPDF}
              title="Preview PDF"
            >
              <FileText className="w-4 h-4" />
            </Button>
            <div className="relative">
              <Button 
                variant={emailStatus !== 'idle' ? 'outline' : 'ghost'}
                size="sm" 
                className={`h-8 w-8 p-0 transition-all duration-500 border ${getEmailButtonClass()}`}
                onClick={() => setIsEmailDialogOpen(true)}
                title={emailStatus === 'success' ? 'Email sent successfully!' : emailStatus === 'error' ? 'Email failed to send' : 'Email Quote'}
              >
                {getEmailIcon()}
              </Button>
              {getEmailOpenIndicator() && (
                <div className="absolute -top-1 -right-1">
                  {getEmailOpenIndicator()}
                </div>
              )}
            </div>
            {isAdmin && onCopyQuote && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                onClick={() => onCopyQuote(quote)}
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
                onClick={() => onDeleteQuote(quote.id)}
                title="Delete Quote"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      <EmailQuoteDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        quote={quote}
        clientInfo={clientInfo}
        salespersonName={salespersonName}
        onEmailSuccess={handleEmailSuccess}
        onEmailError={handleEmailError}
      />
    </>
  );
};
