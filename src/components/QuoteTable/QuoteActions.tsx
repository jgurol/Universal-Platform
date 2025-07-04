import { Button } from "@/components/ui/button";
import { Pencil, FileText, Copy, XCircle, Trash2 } from "lucide-react";
import { Archive, ArchiveRestore } from "lucide-react";
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
    // Open popup window immediately with loading content
    const popup = window.open('', 'PDFPreview', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (popup) {
      popup.document.write(`
        <html>
          <head><title>Generating PDF...</title></head>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5;">
            <div style="text-align: center;">
              <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 20px;"></div>
              <h3>Generating PDF...</h3>
              <p>Please wait while we create your quote PDF.</p>
            </div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </body>
        </html>
      `);
    }

    try {
      console.log('QuoteActions - Generating PDF with salesperson name:', salespersonName);
      
      // Generate PDF in background
      const pdf = await generateQuotePDF(quote, clientInfo, salespersonName);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Replace popup content with PDF
      if (popup && !popup.closed) {
        popup.location.href = pdfUrl;
      }
      
      toast({
        title: "PDF Generated",
        description: "Quote PDF has been opened in a popup window",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Show error in popup if it's still open
      if (popup && !popup.closed) {
        popup.document.write(`
          <html>
            <head><title>PDF Generation Error</title></head>
            <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5;">
              <div style="text-align: center; color: #e74c3c;">
                <h3>Error Generating PDF</h3>
                <p>There was an error creating the PDF. Please try again.</p>
                <button onclick="window.close()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close</button>
              </div>
            </body>
          </html>
        `);
      }
      
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
                className="h-8 w-8 p-0 text-gray-500 hover:text-orange-600"
                onClick={() => onDeleteQuote(quote.id)}
              >
                <Archive className="w-4 h-4" />
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
                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
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
