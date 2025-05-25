
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Quote, ClientInfo } from "@/pages/Index";
import { EmailQuoteForm } from "./EmailQuoteForm";

interface EmailQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName?: string;
}

export const EmailQuoteDialog = ({ 
  open, 
  onOpenChange, 
  quote, 
  clientInfo, 
  salespersonName
}: EmailQuoteDialogProps) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Email Quote to Customer</DialogTitle>
          <DialogDescription>
            Send the quote PDF directly to your customer's email address.
          </DialogDescription>
        </DialogHeader>
        
        <EmailQuoteForm
          quote={quote}
          clientInfo={clientInfo}
          salespersonName={salespersonName}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
};
