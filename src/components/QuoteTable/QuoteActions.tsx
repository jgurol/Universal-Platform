
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText, Copy, XCircle } from "lucide-react";
import { ArchiveRestore } from "lucide-react";
import { Quote, ClientInfo } from "@/pages/Index";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { useToast } from "@/hooks/use-toast";
import { EmailStatusButton } from "./EmailStatusButton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

interface QuoteActionsProps {
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName: string;
  onEditClick?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onCopyQuote?: (quote: Quote) => void;
  onEmailClick: () => void;
  onUnarchiveQuote?: (quoteId: string) => void;
  onPermanentlyDeleteQuote?: (quoteId: string) => void;
}

export const QuoteActions = ({
  quote,
  clientInfo,
  salespersonName,
  onEditClick,
  onDeleteQuote,
  onCopyQuote,
  onEmailClick,
  onUnarchiveQuote,
  onPermanentlyDeleteQuote
}: QuoteActionsProps) => {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const handlePermanentDelete = () => {
    if (onPermanentlyDeleteQuote) {
      onPermanentlyDeleteQuote(quote.id);
    }
    setIsDeleteDialogOpen(false);
  };

  const isArchived = (quote as any).archived === true;

  return (
    <TooltipProvider>
      <div className="flex gap-1 justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
              onClick={handlePreviewPDF}
            >
              <FileText className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Preview PDF</p>
          </TooltipContent>
        </Tooltip>
        
        <EmailStatusButton 
          quoteId={quote.id}
          onEmailClick={onEmailClick}
        />
        
        {onCopyQuote && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                onClick={() => onCopyQuote(quote)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Quote</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {onEditClick && !isArchived && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                onClick={() => onEditClick(quote)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Quote</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {isArchived && onUnarchiveQuote && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                onClick={() => onUnarchiveQuote(quote.id)}
              >
                <ArchiveRestore className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restore Quote</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {onDeleteQuote && !isArchived && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                onClick={() => onDeleteQuote(quote.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Archive Quote</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onPermanentlyDeleteQuote && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-800"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Permanently Delete Quote?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the quote and all associated data including quote items and acceptance records. The quote will be completely removed from the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handlePermanentDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Permanently Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TooltipTrigger>
            <TooltipContent>
              <p>Permanently delete quote (cannot be undone)</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
