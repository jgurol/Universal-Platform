import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Quote, ClientInfo } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import { useClientContacts } from "@/hooks/useClientContacts";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
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
  const [quoteOwnerName, setQuoteOwnerName] = useState('');
  const [ownerNameLoaded, setOwnerNameLoaded] = useState(false);
  const [messageTemplateSet, setMessageTemplateSet] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { contacts, isLoading: contactsLoading } = useClientContacts(clientInfo?.id || null);

  // Transform contacts to match the expected format for the email components
  const transformedContacts = contacts.map(contact => ({
    id: contact.id,
    name: `${contact.first_name} ${contact.last_name}`,
    email: contact.email || '',
    is_primary: contact.is_primary
  }));

  // Fetch the quote owner's name from the profiles table
  useEffect(() => {
    const fetchQuoteOwnerName = async () => {
      console.log('EmailQuoteForm - Fetching quote owner name for user_id:', quote.user_id);
      
      // If quote doesn't have user_id, use current user as fallback
      const ownerUserId = quote.user_id || user?.id;
      
      if (!ownerUserId) {
        console.log('EmailQuoteForm - No user_id found and no current user, using fallback');
        setQuoteOwnerName('Sales Team');
        setOwnerNameLoaded(true);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', ownerUserId)
          .single();
        
        console.log('EmailQuoteForm - Profile query result:', { profile, error });
        
        if (!error && profile?.full_name && profile.full_name.trim() !== '') {
          console.log('EmailQuoteForm - Found quote owner name:', profile.full_name);
          setQuoteOwnerName(profile.full_name);
        } else if (!error && profile?.email) {
          console.log('EmailQuoteForm - Using email as fallback name:', profile.email);
          setQuoteOwnerName(profile.email.split('@')[0]); // Use part before @ as name
        } else {
          console.log('EmailQuoteForm - Could not fetch quote owner name, using current user fallback');
          // If we can't get the quote owner, use current user info
          if (user?.email) {
            setQuoteOwnerName(user.email.split('@')[0]);
          } else {
            setQuoteOwnerName('Sales Team');
          }
        }
      } catch (error) {
        console.error('EmailQuoteForm - Error fetching quote owner name:', error);
        // Use current user as fallback
        if (user?.email) {
          setQuoteOwnerName(user.email.split('@')[0]);
        } else {
          setQuoteOwnerName('Sales Team');
        }
      }
      setOwnerNameLoaded(true);
    };

    fetchQuoteOwnerName();
  }, [quote.user_id, user]);

  // Set primary contact as default recipient when contacts load
  useEffect(() => {
    if (!contactsLoading && transformedContacts.length > 0 && selectedRecipientContact === "custom") {
      console.log('EmailQuoteForm - Setting up recipient from contacts:', transformedContacts);
      const primaryContact = transformedContacts.find(contact => contact.is_primary && contact.email);
      if (primaryContact) {
        console.log('EmailQuoteForm - Found primary contact:', primaryContact);
        setSelectedRecipientContact(primaryContact.id);
        setRecipientEmail(primaryContact.email);
      } else {
        // If no primary contact with email, use first contact with email
        const firstContactWithEmail = transformedContacts.find(contact => contact.email && contact.email.trim() !== '');
        if (firstContactWithEmail) {
          console.log('EmailQuoteForm - Using first contact with email:', firstContactWithEmail);
          setSelectedRecipientContact(firstContactWithEmail.id);
          setRecipientEmail(firstContactWithEmail.email);
        } else if (clientInfo?.email) {
          console.log('EmailQuoteForm - Using client info email:', clientInfo.email);
          setSelectedRecipientContact("client-info");
          setRecipientEmail(clientInfo.email);
        }
      }
    } else if (!contactsLoading && transformedContacts.length === 0 && clientInfo?.email && selectedRecipientContact === "custom") {
      // No contacts but we have client info email
      console.log('EmailQuoteForm - No contacts, using client info email:', clientInfo.email);
      setSelectedRecipientContact("client-info");
      setRecipientEmail(clientInfo.email);
    }
  }, [contactsLoading, transformedContacts, clientInfo, selectedRecipientContact]);

  // Set the message template with the quote owner's name and selected contact name - ONLY ONCE
  useEffect(() => {
    if (!ownerNameLoaded || messageTemplateSet) {
      return;
    }

    console.log('EmailQuoteForm - Creating message template with quote owner:', quoteOwnerName);
    
    // Get the contact name - prioritize selected contact, then client contact_name
    let contactName = '';
    
    if (selectedRecipientContact === "client-info") {
      // Use client info contact name
      contactName = clientInfo?.contact_name || '';
    } else if (selectedRecipientContact !== "custom") {
      const selectedContact = transformedContacts.find(c => c.id === selectedRecipientContact);
      if (selectedContact?.name) {
        contactName = selectedContact.name;
      }
    }
    
    // If no contact name from selected contact, try client info contact_name as fallback
    if (!contactName && clientInfo?.contact_name) {
      contactName = clientInfo.contact_name;
    }
    
    console.log('EmailQuoteForm - Using contact name for greeting:', contactName);

    const greeting = contactName ? `Hi ${contactName},` : 'Hi,';

    const messageTemplate = `${greeting}

Please find attached your quote for the requested services. If would like to proceed with this proposal click the green accept button on the PDF agreement. If you have any questions please don't hesitate to contact us.

Thank you for your business.

Best regards,
${quoteOwnerName}`;

    console.log('EmailQuoteForm - Setting message template with greeting:', greeting);
    setMessage(messageTemplate);
    setMessageTemplateSet(true);
  }, [ownerNameLoaded, quoteOwnerName, messageTemplateSet]);

  // Update recipient email when contact selection changes
  useEffect(() => {
    if (selectedRecipientContact === "custom") {
      // For custom emails, handle comma-separated values
      const emails = customRecipientEmail.split(',').map(email => email.trim()).filter(email => email);
      setRecipientEmail(emails.join(', '));
    } else if (selectedRecipientContact === "client-info") {
      setRecipientEmail(clientInfo?.email || '');
    } else {
      const selectedContact = transformedContacts.find(c => c.id === selectedRecipientContact);
      if (selectedContact?.email) {
        setRecipientEmail(selectedContact.email);
      }
    }
  }, [selectedRecipientContact, customRecipientEmail, transformedContacts, clientInfo]);

  // Update CC emails when CC contact selection changes
  useEffect(() => {
    const ccEmailList = selectedCcContacts
      .map(contactId => transformedContacts.find(c => c.id === contactId)?.email)
      .filter(email => email && email !== recipientEmail) as string[];
    setCcEmails(ccEmailList);
  }, [selectedCcContacts, transformedContacts, recipientEmail]);

  const handleCcContactToggle = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedCcContacts(prev => [...prev, contactId]);
    } else {
      setSelectedCcContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const removeCcEmail = (emailToRemove: string) => {
    const contactToRemove = transformedContacts.find(c => c.email === emailToRemove);
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

    // Validate email format for custom emails
    if (selectedRecipientContact === "custom") {
      const emails = customRecipientEmail.split(',').map(email => email.trim()).filter(email => email);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        toast({
          title: "Invalid email format",
          description: `Please check the following email(s): ${invalidEmails.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);
    onEmailStatusChange('idle');
    
    try {
      // Fetch primary contact for PDF generation
      let primaryContact = null;
      if (clientInfo?.id) {
        console.log('EmailQuoteForm - Fetching primary contact for PDF generation, client ID:', clientInfo.id);
        const { data: contactData, error: contactError } = await supabase
          .from('client_contacts')
          .select('*')
          .eq('client_info_id', clientInfo.id)
          .eq('is_primary', true)
          .maybeSingle();
        
        if (contactError) {
          console.error('EmailQuoteForm - Error fetching primary contact:', contactError);
        } else if (contactData) {
          primaryContact = contactData;
          console.log('EmailQuoteForm - Found primary contact for PDF:', contactData.first_name, contactData.last_name, 'email:', contactData.email);
        } else {
          console.log('EmailQuoteForm - No primary contact found for PDF generation');
        }
      }

      console.log('EmailQuoteForm - Generating PDF with primary contact:', primaryContact);
      const pdf = await generateQuotePDF(quote, clientInfo, quoteOwnerName);
      const pdfBlob = pdf.output('blob');
      
      const reader = new FileReader();
      reader.onload = async function() {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
          // For custom emails, split comma-separated values into array
          let toEmails: string | string[];
          if (selectedRecipientContact === "custom") {
            const emails = customRecipientEmail.split(',').map(email => email.trim()).filter(email => email);
            toEmails = emails.length === 1 ? emails[0] : emails;
          } else {
            toEmails = recipientEmail;
          }

          // Include primary contact in the email function call
          const { data, error } = await supabase.functions.invoke('send-quote-email', {
            body: {
              to: toEmails,
              cc: ccEmails.length > 0 ? ccEmails : undefined,
              subject,
              message,
              pdfBase64: base64String,
              fileName: `Quote_${quote.quoteNumber || quote.id.slice(0, 8)}.pdf`,
              quoteId: quote.id,
              primaryContact // Pass the primary contact to the email function
            }
          });

          if (error) {
            console.error('Supabase function error:', error);
            onEmailStatusChange('error');
            
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
            
            await supabase
              .from('quotes')
              .update({ email_status: 'success' })
              .eq('id', quote.id);

            const recipientCount = selectedRecipientContact === "custom" 
              ? customRecipientEmail.split(',').map(email => email.trim()).filter(email => email).length
              : 1;
            
            toast({
              title: "Email sent successfully",
              description: `Quote has been sent to ${recipientCount} recipient(s)${ccEmails.length > 0 ? ` and ${ccEmails.length} CC recipient(s)` : ''}`,
            });
            
            setTimeout(() => {
              onClose();
            }, 3000);
          } else {
            onEmailStatusChange('error');
            
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

  // Get current contact name for the template editor
  const getCurrentContactName = () => {
    if (selectedRecipientContact === "client-info") {
      return clientInfo?.contact_name || '';
    } else if (selectedRecipientContact !== "custom") {
      const selectedContact = transformedContacts.find(c => c.id === selectedRecipientContact);
      return selectedContact?.name || '';
    }
    return clientInfo?.contact_name || '';
  };

  return (
    <div className="space-y-4">
      <EmailContactSelector
        contacts={transformedContacts}
        contactsLoading={contactsLoading}
        selectedRecipientContact={selectedRecipientContact}
        onRecipientContactChange={setSelectedRecipientContact}
        customRecipientEmail={customRecipientEmail}
        onCustomRecipientEmailChange={setCustomRecipientEmail}
        clientInfo={clientInfo}
      />

      <CCContactSelector
        contacts={transformedContacts}
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
        contactName={getCurrentContactName()}
        quoteOwnerName={quoteOwnerName}
        recipientEmails={recipientEmail}
      />

      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Attachment:</strong> Quote_{quote.quoteNumber || quote.id.slice(0, 8)}.pdf
        </p>
      </div>

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
