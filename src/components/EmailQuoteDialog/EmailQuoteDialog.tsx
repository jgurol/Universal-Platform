
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Quote, ClientInfo } from "@/pages/Index";
import { EmailStatusIndicator } from "./EmailStatusIndicator";
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
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const resetForm = () => {
    setEmailStatus('idle');
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EmailStatusIndicator emailStatus={emailStatus} />
          </DialogTitle>
          <DialogDescription>
            Send the quote PDF directly to your customer's email address.
          </DialogDescription>
        </DialogHeader>
        
        <EmailQuoteForm
          quote={quote}
          clientInfo={clientInfo}
          salespersonName={salespersonName}
          onEmailStatusChange={setEmailStatus}
          onClose={handleClose}
          emailStatus={emailStatus}
        />
      </DialogContent>
    </Dialog>
  );
};
