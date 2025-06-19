
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Quote, ClientInfo } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { generateQuotePDFWithReactPdf } from "@/utils/pdf/reactPdfGenerator";
import { useQuery } from "@tanstack/react-query";
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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Contact selection state
  const [selectedRecipientContact, setSelectedRecipientContact] = useState<string>("custom");
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");
  const [selectedCcContacts, setSelectedCcContacts] = useState<string[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  
  // Form fields
  const [subject, setSubject] = useState(`Quote ${quote.quoteNumber || quote.id} - ${quote.description || 'Service Agreement'}`);
  const [message, setMessage] = useState(`Please find attached your quote for the requested services.\n\nThank you for your business!\n\nBest regards,\n${salespersonName || user?.user_metadata?.full_name || 'Sales Team'}`);

  // Fetch contacts for the client
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['client-contacts', clientInfo?.id],
    queryFn: async () => {
      if (!clientInfo?.id) return [];
      
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_info_id', clientInfo.id)
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientInfo?.id
  });

  const handleCcContactToggle = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedCcContacts(prev => [...prev, contactId]);
    } else {
      setSelectedCcContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleRemoveCcEmail = (emailToRemove: string) => {
    setCcEmails(prev => prev.filter(email => email !== emailToRemove));
  };

  const getRecipientEmail = () => {
    if (selectedRecipientContact === "custom") {
      return customRecipientEmail;
    }
    const contact = contacts.find(c => c.id === selectedRecipientContact);
    return contact?.email || "";
  };

  const getAllCcEmails = () => {
    const contactEmails = selectedCcContacts
      .map(contactId => contacts.find(c => c.id === contactId)?.email)
      .filter(Boolean) as string[];
    
    return [...contactEmails, ...ccEmails];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipientEmail = getRecipientEmail();
    if (!recipientEmail.trim()) {
      alert('Please enter a recipient email address');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('[EmailQuoteForm] Generating PDF with React PDF renderer for email');
      
      // Generate PDF using React PDF renderer
      const pdfBlob = await generateQuotePDFWithReactPdf(quote, clientInfo);
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(pdfBlob);
      const pdfBase64 = await base64Promise;
      
      // Prepare CC emails
      const allCcEmails = getAllCcEmails().filter(email => email && email.length > 0);

      // Send email via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          to: recipientEmail,
          cc: allCcEmails.length > 0 ? allCcEmails : undefined,
          subject: subject,
          message: message,
          pdfBase64: pdfBase64,
          quoteId: quote.id,
          fileName: `quote-${quote.quoteNumber || quote.id}.pdf`
        }
      });

      if (error) {
        throw error;
      }

      console.log('[EmailQuoteForm] Email sent successfully:', data);
      onEmailStatusChange('success');
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('[EmailQuoteForm] Error sending email:', error);
      onEmailStatusChange('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        onRemoveCcEmail={handleRemoveCcEmail}
      />

      <Separator />

      <EmailFormFields
        subject={subject}
        onSubjectChange={setSubject}
        message={message}
        onMessageChange={setMessage}
        quoteNumber={quote.quoteNumber}
        quoteId={quote.id}
      />

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !getRecipientEmail().trim() || emailStatus === 'success'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Sending...' : emailStatus === 'success' ? 'Sent!' : 'Send Quote'}
        </Button>
      </div>
    </form>
  );
};
