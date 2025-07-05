import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Quote, ClientInfo } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";
import { useClientContacts } from "@/hooks/useClientContacts";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Mail } from "lucide-react";
import { EmailFormFields } from "./EmailFormFields";
import { EmailTemplateSelector } from "./EmailTemplateSelector";
import { EmailTemplate } from "@/hooks/useEmailTemplates";
import { replaceTemplateVariables, TemplateVariables } from "@/utils/emailTemplateVariables";

interface EmailQuoteFormProps {
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName?: string;
  onEmailStatusChange: (status: 'idle' | 'success' | 'error') => void;
  onClose: () => void;
  emailStatus: 'idle' | 'success' | 'error';
  onEmailSent?: () => void;
}

export const EmailQuoteForm = ({
  quote,
  clientInfo,
  salespersonName,
  onEmailStatusChange,
  onClose,
  emailStatus,
  onEmailSent
}: EmailQuoteFormProps) => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [bccEmails, setBccEmails] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(`Quote #${quote.quoteNumber || quote.id.slice(0, 8)} - ${quote.description || 'Service Agreement'}`);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quoteOwnerName, setQuoteOwnerName] = useState('');
  const [ownerNameLoaded, setOwnerNameLoaded] = useState(false);
  const [messageTemplateSet, setMessageTemplateSet] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("none");
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const { contacts, isLoading: contactsLoading } = useClientContacts(clientInfo?.id || null);

  // Transform contacts to match the expected format for the email components
  const transformedContacts = contacts.map(contact => ({
    id: contact.id,
    name: `${contact.first_name} ${contact.last_name}`,
    email: contact.email || '',
    is_primary: contact.is_primary
  }));

  // Fetch the quote owner's name
  useEffect(() => {
    const fetchQuoteOwnerInfo = async () => {
      console.log('EmailQuoteForm - Fetching quote owner info for user_id:', quote.user_id);
      
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
        
        if (!error && profile) {
          const name = profile.full_name && profile.full_name.trim() !== '' 
            ? profile.full_name 
            : profile.email?.split('@')[0] || 'Sales Team';
          
          console.log('EmailQuoteForm - Found quote owner info:', name);
          setQuoteOwnerName(name);
        } else {
          console.log('EmailQuoteForm - Could not fetch quote owner info, using current user fallback');
          // If we can't get the quote owner, use current user info
          const name = user?.email?.split('@')[0] || 'Sales Team';
          setQuoteOwnerName(name);
        }
      } catch (error) {
        console.error('EmailQuoteForm - Error fetching quote owner info:', error);
        // Use current user as fallback
        const name = user?.email?.split('@')[0] || 'Sales Team';
        setQuoteOwnerName(name);
      }
      setOwnerNameLoaded(true);
    };

    fetchQuoteOwnerInfo();
  }, [quote.user_id, user]);

  // Set primary contact as default recipient when contacts load
  useEffect(() => {
    if (!contactsLoading && transformedContacts.length > 0 && !recipientEmail) {
      console.log('EmailQuoteForm - Setting up recipient from contacts:', transformedContacts);
      const primaryContact = transformedContacts.find(contact => contact.is_primary && contact.email);
      if (primaryContact) {
        console.log('EmailQuoteForm - Found primary contact:', primaryContact);
        setRecipientEmail(primaryContact.email);
        setPrimaryContactName(primaryContact.name);
      } else {
        // If no primary contact with email, use first contact with email
        const firstContactWithEmail = transformedContacts.find(contact => contact.email && contact.email.trim() !== '');
        if (firstContactWithEmail) {
          console.log('EmailQuoteForm - Using first contact with email:', firstContactWithEmail);
          setRecipientEmail(firstContactWithEmail.email);
          setPrimaryContactName(firstContactWithEmail.name);
        }
      }
    }
  }, [contactsLoading, transformedContacts, recipientEmail]);

  // Set the message template with the quote owner's name and primary contact name - ONLY ONCE
  useEffect(() => {
    if (!ownerNameLoaded || messageTemplateSet || isUsingTemplate) {
      return;
    }

    console.log('EmailQuoteForm - Creating message template with quote owner:', quoteOwnerName);
    
    // Get the primary contact name from the contacts list
    let contactName = '';
    const primaryContact = transformedContacts.find(contact => contact.is_primary);
    if (primaryContact) {
      contactName = primaryContact.name;
      setPrimaryContactName(contactName);
    } else if (transformedContacts.length > 0) {
      // Use first contact if no primary contact
      contactName = transformedContacts[0].name;
      setPrimaryContactName(contactName);
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
  }, [ownerNameLoaded, quoteOwnerName, messageTemplateSet, transformedContacts, isUsingTemplate]);

  // Apply template variables when all data is ready
  useEffect(() => {
    if (selectedTemplate && ownerNameLoaded && primaryContactName && !contactsLoading) {
      console.log('EmailQuoteForm - Applying template variables for:', selectedTemplate.name);
      const variables = createTemplateVariables();
      const processedSubject = replaceTemplateVariables(selectedTemplate.subject, variables);
      const processedContent = replaceTemplateVariables(selectedTemplate.content, variables);
      
      setSubject(processedSubject);
      setMessage(processedContent);
    }
  }, [selectedTemplate, ownerNameLoaded, primaryContactName, contactsLoading]);

  const createTemplateVariables = (): TemplateVariables => {
    const clientFirstName = primaryContactName.split(' ')[0] || '';
    const clientLastName = primaryContactName.split(' ').slice(1).join(' ') || '';
    
    return {
      quoteNumber: quote.quoteNumber || quote.id.slice(0, 8),
      clientFirstName,
      clientLastName,
      salesPerson: quoteOwnerName,
      companyName: clientInfo?.company_name || '',
      quoteAmount: `$${quote.amount.toLocaleString()}`,
      quoteDescription: quote.description || 'Service Agreement'
    };
  };

  const handleTemplateSelect = (template: EmailTemplate | null) => {
    if (template) {
      console.log('EmailQuoteForm - Template selected:', template.name);
      setSelectedTemplateId(template.id);
      setSelectedTemplate(template);
      setIsUsingTemplate(true);
      setMessageTemplateSet(true);
      
      // Apply variables immediately if data is ready
      if (ownerNameLoaded && primaryContactName) {
        const variables = createTemplateVariables();
        const processedSubject = replaceTemplateVariables(template.subject, variables);
        const processedContent = replaceTemplateVariables(template.content, variables);
        
        setSubject(processedSubject);
        setMessage(processedContent);
      }
    } else {
      console.log('EmailQuoteForm - Clearing template, using default');
      setSelectedTemplateId("none");
      setSelectedTemplate(null);
      setIsUsingTemplate(false);
      setMessageTemplateSet(false);
      // Reset to default subject and clear message so the default template gets applied
      setSubject(`Quote #${quote.quoteNumber || quote.id.slice(0, 8)} - ${quote.description || 'Service Agreement'}`);
      setMessage('');
    }
  };

  // Handle direct recipient email changes
  const handleRecipientEmailChange = (value: string) => {
    setRecipientEmail(value);
  };

  const validateEmails = (emails: string) => {
    if (!emails.trim()) return [];
    const emailArray = emails.split(',').map(email => email.trim()).filter(email => email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailArray.filter(email => !emailRegex.test(email));
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

    // Validate all email fields
    const invalidRecipients = validateEmails(recipientEmail);
    const invalidCC = validateEmails(ccEmails);
    const invalidBCC = validateEmails(bccEmails);
    
    const allInvalid = [...invalidRecipients, ...invalidCC, ...invalidBCC];
    
    if (allInvalid.length > 0) {
      toast({
        title: "Invalid email format",
        description: `Please check the following email(s): ${allInvalid.join(', ')}`,
        variant: "destructive"
      });
      return;
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
          // Prepare email recipients
          const toEmails = recipientEmail.split(',').map(email => email.trim()).filter(email => email);
          const ccEmailsArray = ccEmails ? ccEmails.split(',').map(email => email.trim()).filter(email => email) : [];
          const bccEmailsArray = bccEmails ? bccEmails.split(',').map(email => email.trim()).filter(email => email) : [];

          const { data, error } = await supabase.functions.invoke('send-quote-email', {
            body: {
              to: toEmails.length === 1 ? toEmails[0] : toEmails,
              cc: ccEmailsArray.length > 0 ? ccEmailsArray : undefined,
              bcc: bccEmailsArray.length > 0 ? bccEmailsArray : undefined,
              subject,
              message,
              pdfBase64: base64String,
              fileName: `Quote_${quote.quoteNumber || quote.id.slice(0, 8)}.pdf`,
              quoteId: quote.id,
              primaryContact
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

            const totalRecipients = toEmails.length + ccEmailsArray.length + bccEmailsArray.length;
            
            toast({
              title: "Email sent successfully",
              description: `Quote has been sent to ${totalRecipients} recipient(s)`,
            });
            
            // Notify parent component to refresh data
            if (onEmailSent) {
              onEmailSent();
            }
            
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

  // Get current primary contact name for the template editor
  const getCurrentContactName = () => {
    const primaryContact = transformedContacts.find(contact => contact.is_primary);
    if (primaryContact) {
      return primaryContact.name;
    } else if (transformedContacts.length > 0) {
      return transformedContacts[0].name;
    }
    return '';
  };

  return (
    <div className="space-y-4">
      <EmailTemplateSelector
        selectedTemplateId={selectedTemplateId}
        onTemplateSelect={handleTemplateSelect}
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
        fromEmail="sales@californiatelecom.com"
        recipientEmails={recipientEmail}
        onRecipientEmailsChange={handleRecipientEmailChange}
        ccEmails={ccEmails}
        onCcEmailsChange={setCcEmails}
        bccEmails={bccEmails}
        onBccEmailsChange={setBccEmails}
        showCcBcc={showCcBcc}
        onToggleCcBcc={() => setShowCcBcc(!showCcBcc)}
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
