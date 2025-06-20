import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Quote, ClientInfo } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import { useClientContacts } from "@/hooks/useClientContacts";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";
import { EmailContactSelector } from "./EmailContactSelector";
import { CCContactSelector } from "./CCContactSelector";
import { EmailFormFields } from "./EmailFormFields";

interface EmailQuoteFormProps {
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName?: string;
  onEmailStatusChange: (status: 'idle' | 'success' | 'error') => void;
  onClose: () => void;
  emailStatus: 'idle' | 'success' | 'error';
}

export const EmailQuoteForm = ({
  quote,
  clientInfo,
  salespersonName,
  onEmailStatusChange,
  onClose,
  emailStatus
}: EmailQuoteFormProps) => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [selectedRecipientContact, setSelectedRecipientContact] = useState<string>("custom");
  const [selectedCcContacts, setSelectedCcContacts] = useState<string[]>([]);
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");
  const [subject, setSubject] = useState(`Quote #${quote.quoteNumber || quote.id.slice(0, 8)} - ${quote.description || 'Service Agreement'}`);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actualSalespersonName, setActualSalespersonName] = useState(salespersonName || 'Sales Team');
  const { toast } = useToast();

  const { contacts, isLoading: contactsLoading } = useClientContacts(clientInfo?.id || null);

  // Fetch the actual salesperson name if not provided
  useEffect(() => {
    const fetchSalespersonName = async () => {
      if (!salespersonName && quote.user_id) {
        console.log('EmailQuoteForm - Fetching salesperson name for user_id:', quote.user_id);
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', quote.user_id)
            .single();
          
          if (!error && profile?.full_name) {
            setActualSalespersonName(profile.full_name);
            console.log('EmailQuoteForm - Found salesperson name:', profile.full_name);
          } else {
            console.log('EmailQuoteForm - Could not fetch salesperson name, using fallback');
          }
        } catch (error) {
          console.error('EmailQuoteForm - Error fetching salesperson name:', error);
        }
      }
    };

    fetchSalespersonName();
  }, [salespersonName, quote.user_id]);

  // Set the message template with the actual salesperson name
  useEffect(() => {
    const messageTemplate = `Dear ${clientInfo?.contact_name || 'Valued Customer'},

Please find attached your quote for the requested services. If you have any questions or would like to proceed with this proposal, please don't hesitate to contact us.

Thank you for your business.

Best regards,
${actualSalespersonName}`;

    setMessage(messageTemplate);
  }, [clientInfo?.contact_name, actualSalespersonName]);

  // Set primary contact as default recipient when component mounts
  useEffect(() => {
    if (contacts.length > 0) {
      console.log('EmailQuoteForm - Setting up recipient from contacts:', contacts);
      const primaryContact = contacts.find(contact => contact.is_primary);
      if (primaryContact?.email) {
        console.log('EmailQuoteForm - Found primary contact:', primaryContact);
        setSelectedRecipientContact(primaryContact.id);
        setRecipientEmail(primaryContact.email);
      } else {
        // If no primary contact with email, use first contact with email
        const firstContactWithEmail = contacts.find(contact => contact.email);
        if (firstContactWithEmail) {
          console.log('EmailQuoteForm - Using first contact with email:', firstContactWithEmail);
          setSelectedRecipientContact(firstContactWithEmail.id);
          setRecipientEmail(firstContactWithEmail.email);
        } else if (clientInfo?.email) {
          console.log('EmailQuoteForm - Using client info email:', clientInfo.email);
          setRecipientEmail(clientInfo.email);
          setCustomRecipientEmail(clientInfo.email);
        }
      }
    } else if (clientInfo?.email) {
      console.log('EmailQuoteForm - No contacts, using client info email:', clientInfo.email);
      setRecipientEmail(clientInfo.email);
      setCustomRecipientEmail(clientInfo.email);
    }
  }, [contacts, clientInfo]);

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
    onEmailStatusChange('idle');
    
    try {
      const pdf = await generateQuotePDF(quote, clientInfo, actualSalespersonName);
      const pdfBlob = pdf.output('blob');
      
      const reader = new FileReader();
      reader.onload = async function() {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
          const { data, error } = await supabase.functions.invoke('send-quote-email', {
            body: {
              to: recipientEmail,
              cc: ccEmails.length > 0 ? ccEmails : undefined,
              subject,
              message,
              pdfBase64: base64String,
              fileName: `Quote_${quote.quoteNumber || quote.id.slice(0, 8)}.pdf`,
              quoteId: quote.id
            }
          });

          if (error) {
            console.error('Supabase function error:', error);
            onEmailStatusChange('error');
            
            // Update database with error status
            await supabase
              .from('quotes')
              .update({ email_status: 'error' })
              .eq('id', quote.id);
            
            toast({
              title: "Failed to send email",
              description: error.message || "There was an error sending the quote. Please try again.",
              variant: "destructive"
            });
            return;
          }

          if (data?.success === true) {
            onEmailStatusChange('success');
            
            // Update database with success status
            await supabase
              .from('quotes')
              .update({ email_status: 'success' })
              .eq('id', quote.id);
            
            toast({
              title: "Email sent successfully",
              description: `Quote has been sent to ${recipientEmail}${ccEmails.length > 0 ? ` and ${ccEmails.length} CC recipient(s)` : ''}`,
            });
            
            setTimeout(() => {
              onClose();
            }, 3000);
          } else {
            onEmailStatusChange('error');
            
            // Update database with error status
            await supabase
              .from('quotes')
              .update({ email_status: 'error' })
              .eq('id', quote.id);
            
            toast({
              title: "Failed to send email",
              description: data?.error || "There was an error sending the quote. Please try again.",
              variant: "destructive"
            });
          }
        } catch (emailError) {
          console.error('Error calling email function:', emailError);
          onEmailStatusChange('error');
          
          // Update database with error status
          await supabase
            .from('quotes')
            .update({ email_status: 'error' })
            .eq('id', quote.id);
          
          toast({
            title: "Failed to send email",
            description: "There was an error sending the quote. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(pdfBlob);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      onEmailStatusChange('error');
      
      // Update database with error status
      await supabase
        .from('quotes')
        .update({ email_status: 'error' })
        .eq('id', quote.id);
      
      toast({
        title: "Failed to generate PDF",
        description: "There was an error generating the quote PDF. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <EmailContactSelector
        contacts={contacts}
        contactsLoading={contactsLoading}
        selectedRecipientContact={selectedRecipientContact}
        onRecipientContactChange={setSelectedRecipientContact}
        customRecipientEmail={customRecipientEmail}
        onCustomRecipientEmailChange={setCustomRecipientEmail}
      />

      <CCContactSelector
        contacts={contacts}
        selectedRecipientContact={selectedRecipientContact}
        selectedCcContacts={selectedCcContacts}
        onCcContactToggle={handleCcContactToggle}
        ccEmails={ccEmails}
        onRemoveCcEmail={removeCcEmail}
      />

      <EmailFormFields
        subject={subject}
        onSubjectChange={setSubject}
        message={message}
        onMessageChange={setMessage}
        quoteNumber={quote.quoteNumber}
        quoteId={quote.id}
      />

      <div className="flex justify-end space-x-2 mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSendEmail}
          disabled={isLoading || !recipientEmail}
          className={`transition-colors duration-300 ${
            emailStatus === 'success' 
              ? 'bg-green-600 hover:bg-green-700' 
              : emailStatus === 'error'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Mail className="w-4 h-4 mr-2" />
          {isLoading ? "Sending..." : emailStatus === 'success' ? "Email Sent!" : "Send Email"}
        </Button>
      </div>
    </div>
  );
};
