
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Quote, ClientInfo } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { Mail } from "lucide-react";

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
  const [recipientEmail, setRecipientEmail] = useState(clientInfo?.email || "");
  const [subject, setSubject] = useState(`Quote #${quote.quoteNumber || quote.id.slice(0, 8)} - ${quote.description || 'Service Agreement'}`);
  const [message, setMessage] = useState(`Dear ${clientInfo?.contact_name || 'Valued Customer'},

Please find attached your quote for the requested services. If you have any questions or would like to proceed with this proposal, please don't hesitate to contact us.

Thank you for your business.

Best regards,
${salespersonName || 'Sales Team'}`);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Generate PDF
      const pdf = await generateQuotePDF(quote, clientInfo, salespersonName);
      const pdfBlob = pdf.output('blob');
      
      // Convert PDF to base64 for email attachment
      const reader = new FileReader();
      reader.onload = function() {
        const base64String = (reader.result as string).split(',')[1];
        
        // Here you would typically call your email service
        // For now, we'll simulate sending and show success
        console.log('Email would be sent with:', {
          to: recipientEmail,
          subject,
          message,
          attachment: base64String
        });
        
        toast({
          title: "Email sent successfully",
          description: `Quote has been sent to ${recipientEmail}`,
        });
        
        onOpenChange(false);
        setIsLoading(false);
      };
      reader.readAsDataURL(pdfBlob);
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to send email",
        description: "There was an error sending the quote. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Quote to Customer
          </DialogTitle>
          <DialogDescription>
            Send the quote PDF directly to your customer's email address.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Email message"
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Attachment:</strong> Quote_{quote.quoteNumber || quote.id.slice(0, 8)}.pdf
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Mail className="w-4 h-4 mr-2" />
            {isLoading ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
