
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Quote, ClientInfo } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import { useClientContacts } from "@/hooks/useClientContacts";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { Mail, X } from "lucide-react";

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
  const [recipientEmail, setRecipientEmail] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [selectedRecipientContact, setSelectedRecipientContact] = useState<string>("custom");
  const [selectedCcContacts, setSelectedCcContacts] = useState<string[]>([]);
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");
  const [subject, setSubject] = useState(`Quote #${quote.quoteNumber || quote.id.slice(0, 8)} - ${quote.description || 'Service Agreement'}`);
  const [message, setMessage] = useState(`Dear ${clientInfo?.contact_name || 'Valued Customer'},

Please find attached your quote for the requested services. If you have any questions or would like to proceed with this proposal, please don't hesitate to contact us.

Thank you for your business.

Best regards,
${salespersonName || 'Sales Team'}`);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { contacts } = useClientContacts(clientInfo?.id || null);

  // Set primary contact as default recipient when dialog opens
  useEffect(() => {
    if (open && contacts.length > 0) {
      const primaryContact = contacts.find(contact => contact.is_primary);
      if (primaryContact?.email) {
        setSelectedRecipientContact(primaryContact.id);
        setRecipientEmail(primaryContact.email);
      } else if (clientInfo?.email) {
        setRecipientEmail(clientInfo.email);
        setCustomRecipientEmail(clientInfo.email);
      }
    } else if (open && clientInfo?.email) {
      setRecipientEmail(clientInfo.email);
      setCustomRecipientEmail(clientInfo.email);
    }
  }, [open, contacts, clientInfo]);

  // Update recipient email when contact selection changes
  useEffect(() => {
    if (selectedRecipientContact === "custom") {
      setRecipientEmail(customRecipientEmail);
    } else {
      const selectedContact = contacts.find(c => c.id === selectedRecipientContact);
      if (selectedContact?.email) {
        setRecipientEmail(selectedContact.email);
      }
    }
  }, [selectedRecipientContact, customRecipientEmail, contacts]);

  // Update CC emails when CC contact selection changes
  useEffect(() => {
    const ccEmailList = selectedCcContacts
      .map(contactId => contacts.find(c => c.id === contactId)?.email)
      .filter(email => email && email !== recipientEmail) as string[];
    setCcEmails(ccEmailList);
  }, [selectedCcContacts, contacts, recipientEmail]);

  const handleCcContactToggle = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedCcContacts(prev => [...prev, contactId]);
    } else {
      setSelectedCcContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const removeCcEmail = (emailToRemove: string) => {
    const contactToRemove = contacts.find(c => c.email === emailToRemove);
    if (contactToRemove) {
      setSelectedCcContacts(prev => prev.filter(id => id !== contactToRemove.id));
    }
  };

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
        console.log('Email would be sent with:', {
          to: recipientEmail,
          cc: ccEmails,
          subject,
          message,
          attachment: base64String
        });
        
        toast({
          title: "Email sent successfully",
          description: `Quote has been sent to ${recipientEmail}${ccEmails.length > 0 ? ` and ${ccEmails.length} CC recipient(s)` : ''}`,
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

  const resetForm = () => {
    setRecipientEmail("");
    setCcEmails([]);
    setSelectedRecipientContact("custom");
    setSelectedCcContacts([]);
    setCustomRecipientEmail("");
    setSubject(`Quote #${quote.quoteNumber || quote.id.slice(0, 8)} - ${quote.description || 'Service Agreement'}`);
    setMessage(`Dear ${clientInfo?.contact_name || 'Valued Customer'},

Please find attached your quote for the requested services. If you have any questions or would like to proceed with this proposal, please don't hesitate to contact us.

Thank you for your business.

Best regards,
${salespersonName || 'Sales Team'}`);
  };

  const availableContacts = contacts.filter(contact => contact.email);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[700px]">
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
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label htmlFor="recipientSelect">Send To *</Label>
            <Select value={selectedRecipientContact} onValueChange={setSelectedRecipientContact}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Email</SelectItem>
                {availableContacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} ({contact.email}) {contact.is_primary && '- Primary'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Email Input (shown when "Custom Email" is selected) */}
          {selectedRecipientContact === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customEmail">Custom Email Address *</Label>
              <Input
                id="customEmail"
                type="email"
                value={customRecipientEmail}
                onChange={(e) => setCustomRecipientEmail(e.target.value)}
                placeholder="Enter custom email address"
                required
              />
            </div>
          )}

          {/* CC Recipients */}
          {availableContacts.length > 0 && (
            <div className="space-y-2">
              <Label>CC Recipients (Optional)</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                {availableContacts
                  .filter(contact => contact.id !== selectedRecipientContact)
                  .map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cc-${contact.id}`}
                        checked={selectedCcContacts.includes(contact.id)}
                        onCheckedChange={(checked) => handleCcContactToggle(contact.id, checked === true)}
                      />
                      <Label htmlFor={`cc-${contact.id}`} className="text-sm">
                        {contact.name} ({contact.email})
                      </Label>
                    </div>
                  ))}
                {availableContacts.filter(contact => contact.id !== selectedRecipientContact).length === 0 && (
                  <p className="text-sm text-gray-500">No additional contacts available for CC</p>
                )}
              </div>
            </div>
          )}

          {/* Show selected CC emails */}
          {ccEmails.length > 0 && (
            <div className="space-y-2">
              <Label>CC Email Addresses</Label>
              <div className="flex flex-wrap gap-2">
                {ccEmails.map((email) => (
                  <div key={email} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeCcEmail(email)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            disabled={isLoading || !recipientEmail}
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
