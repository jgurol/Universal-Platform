
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Quote, ClientInfo } from "@/pages/Index";
import { markdownToPdf } from "@/utils/markdownToPdf";
import { EmailContactSelector } from "./EmailContactSelector";
import { CCContactSelector } from "./CCContactSelector";
import { EmailFormFields } from "./EmailFormFields";
import { EmailStatusIndicator } from "./EmailStatusIndicator";

interface EmailQuoteFormProps {
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName?: string;
  onClose: () => void;
}

export const EmailQuoteForm = ({ quote, clientInfo, salespersonName, onClose }: EmailQuoteFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Mock contacts data - in a real app, this would come from the database
  const contacts = [
    {
      id: "1",
      name: clientInfo?.contact_name || "Primary Contact",
      email: clientInfo?.email || "",
      is_primary: true
    }
  ].filter(contact => contact.email);

  const [selectedRecipientContact, setSelectedRecipientContact] = useState("");
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");
  const [selectedCcContacts, setSelectedCcContacts] = useState<string[]>([]);

  // Load email status when component mounts
  useEffect(() => {
    const loadEmailStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select('email_status')
          .eq('id', quote.id)
          .single();

        if (!error && data?.email_status) {
          setEmailStatus(data.email_status as 'idle' | 'success' | 'error');
        }
      } catch (err) {
        console.error('Error loading email status:', err);
      }
    };

    loadEmailStatus();
  }, [quote.id]);

  // Set up real-time subscription for email status
  useEffect(() => {
    const channel = supabase
      .channel(`email-status-${quote.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quotes',
          filter: `id=eq.${quote.id}`
        },
        (payload) => {
          console.log('EmailQuoteForm - Real-time update:', payload);
          const newData = payload.new as any;
          if (newData.email_status) {
            setEmailStatus(newData.email_status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quote.id]);

  useEffect(() => {
    // Set default recipient
    if (clientInfo?.email) {
      setTo(clientInfo.email);
      if (contacts.length > 0) {
        setSelectedRecipientContact(contacts[0].id);
      }
    } else {
      setSelectedRecipientContact("custom");
    }

    // Set default subject
    const defaultSubject = `Quote #${quote.quoteNumber || quote.id.slice(0, 8)} - ${clientInfo?.company_name || quote.clientName}`;
    setSubject(defaultSubject);

    // Set default message
    const defaultMessage = `Dear ${clientInfo?.contact_name || 'Valued Customer'},

Please find attached your requested quote for telecommunications services.

We appreciate your interest in our services and look forward to working with you.

Best regards,
${salespersonName}`;

    setMessage(defaultMessage);
  }, [clientInfo, quote, salespersonName, contacts]);

  const handleRecipientContactChange = (value: string) => {
    setSelectedRecipientContact(value);
    if (value === "custom") {
      setTo(customRecipientEmail);
    } else {
      const contact = contacts.find(c => c.id === value);
      if (contact) {
        setTo(contact.email);
      }
    }
  };

  const handleCustomRecipientEmailChange = (value: string) => {
    setCustomRecipientEmail(value);
    if (selectedRecipientContact === "custom") {
      setTo(value);
    }
  };

  const handleCcContactToggle = (contactId: string, checked: boolean) => {
    const newSelectedCcContacts = checked 
      ? [...selectedCcContacts, contactId]
      : selectedCcContacts.filter(id => id !== contactId);
    
    setSelectedCcContacts(newSelectedCcContacts);
    
    // Update cc emails based on selected contacts
    const ccEmails = newSelectedCcContacts
      .map(id => contacts.find(c => c.id === id)?.email)
      .filter(Boolean) as string[];
    setCc(ccEmails);
  };

  const handleRemoveCcEmail = (email: string) => {
    const updatedCc = cc.filter(e => e !== email);
    setCc(updatedCc);
    
    // Also remove from selected contacts if it matches
    const contact = contacts.find(c => c.email === email);
    if (contact) {
      setSelectedCcContacts(prev => prev.filter(id => id !== contact.id));
    }
  };

  const handleSendEmail = async () => {
    if (!to || !subject || !message) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields (To, Subject, Message).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Generating PDF for quote:', quote.id);
      
      // Generate PDF
      const pdfBlob = await markdownToPdf(quote, clientInfo, salespersonName);
      
      // Convert PDF to base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      
      reader.onload = async () => {
        try {
          const base64data = reader.result as string;
          const base64PDF = base64data.split(',')[1]; // Remove data:application/pdf;base64, prefix
          
          console.log('Sending email for quote:', quote.id);
          
          // Send email using edge function
          const { data, error } = await supabase.functions.invoke('send-quote-email', {
            body: {
              to,
              cc: cc.length > 0 ? cc : undefined,
              subject,
              message,
              pdfBase64: base64PDF,
              fileName: `Quote_${quote.quoteNumber || quote.id.slice(0, 8)}.pdf`,
              quoteId: quote.id
            }
          });

          console.log('Email send response:', data, error);

          if (error) {
            throw error;
          }

          if (data?.success) {
            toast({
              title: "Email sent successfully!",
              description: `Quote has been sent to ${to}`,
            });
            
            // Wait a moment for the database to update, then trigger a refresh
            setTimeout(() => {
              // Trigger a page refresh to update the quote list
              window.location.reload();
            }, 1000);
            
            onClose();
          } else {
            throw new Error(data?.error || 'Failed to send email');
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          toast({
            title: "Failed to send email",
            description: emailError instanceof Error ? emailError.message : "An unexpected error occurred",
            variant: "destructive",
          });
        }
      };

      reader.onerror = () => {
        console.error('Error reading PDF file');
        toast({
          title: "Error",
          description: "Failed to process PDF file",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error('Error in handleSendEmail:', error);
      toast({
        title: "Error",
        description: "Failed to generate quote PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <EmailStatusIndicator emailStatus={emailStatus} />
      
      <Card>
        <CardHeader>
          <CardTitle>Send Quote via Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailContactSelector
            contacts={contacts}
            contactsLoading={false}
            selectedRecipientContact={selectedRecipientContact}
            onRecipientContactChange={handleRecipientContactChange}
            customRecipientEmail={customRecipientEmail}
            onCustomRecipientEmailChange={handleCustomRecipientEmailChange}
          />

          <CCContactSelector
            contacts={contacts}
            selectedRecipientContact={selectedRecipientContact}
            selectedCcContacts={selectedCcContacts}
            onCcContactToggle={handleCcContactToggle}
            ccEmails={cc}
            onRemoveCcEmail={handleRemoveCcEmail}
          />

          <EmailFormFields
            subject={subject}
            message={message}
            onSubjectChange={setSubject}
            onMessageChange={setMessage}
            quoteNumber={quote.quoteNumber}
            quoteId={quote.id}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
