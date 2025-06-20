
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText, Copy } from "lucide-react";
import { ArchiveRestore } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Quote, ClientInfo } from "@/pages/Index";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import { EmailStatusButton } from "./EmailStatusButton";

interface QuoteActionsProps {
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName: string;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onCopyQuote?: (quote: Quote) => void;
  onEmailClick: () => void;
  onUnarchiveQuote?: (quoteId: string) => void;
}

export const QuoteActions = ({
  quote,
  clientInfo,
  salespersonName,
  onEditClick,
  onDeleteQuote,
  onCopyQuote,
  onEmailClick,
  onUnarchiveQuote
}: QuoteActionsProps) => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const handlePreviewPDF = async () => {
    try {
      console.log('QuoteActions - Generating PDF with salesperson name:', salespersonName);
      
      // The generateQuotePDF function will now fetch the quote owner's name if not provided
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

  const isArchived = (quote as any).archived === true;

  return (
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
      
      <EmailStatusButton 
        quoteId={quote.id}
        onEmailClick={onEmailClick}
      />
      
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
      
      {isAdmin && onEditClick && !isArchived && (
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
      
      {isAdmin && isArchived && onUnarchiveQuote && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
          onClick={() => onUnarchiveQuote(quote.id)}
          title="Restore Quote"
        >
          <ArchiveRestore className="w-4 h-4" />
        </Button>
      )}
      
      {isAdmin && onDeleteQuote && !isArchived && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
          onClick={() => onDeleteQuote(quote.id)}
          title="Archive Quote"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
