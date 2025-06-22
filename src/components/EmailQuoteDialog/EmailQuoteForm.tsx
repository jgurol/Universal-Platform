
import { Button } from "@/components/ui/button";
import { Quote, ClientInfo } from "@/pages/Index";
import { useClientContacts } from "@/hooks/useClientContacts";
import { Mail } from "lucide-react";
import { EmailContactSelector } from "./EmailContactSelector";
import { CCContactSelector } from "./CCContactSelector";
import { EmailFormFields } from "./EmailFormFields";
import { useQuoteOwnerName } from "./hooks/useQuoteOwnerName";
import { useEmailTemplate } from "./hooks/useEmailTemplate";
import { useEmailContacts } from "./hooks/useEmailContacts";
import { useEmailSending } from "./hooks/useEmailSending";

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
  const { contacts, isLoading: contactsLoading } = useClientContacts(clientInfo?.id || null);

  // Transform contacts to match the expected format for the email components
  const transformedContacts = contacts.map(contact => ({
    id: contact.id,
    name: `${contact.first_name} ${contact.last_name}`,
    email: contact.email || '',
    is_primary: contact.is_primary
  }));

  const { quoteOwnerName, ownerNameLoaded } = useQuoteOwnerName(quote.user_id);

  const {
    recipientEmail,
    ccEmails,
    selectedRecipientContact,
    setSelectedRecipientContact,
    selectedCcContacts,
    customRecipientEmail,
    setCustomRecipientEmail,
    handleCcContactToggle,
    removeCcEmail
  } = useEmailContacts({ transformedContacts, clientInfo });

  const {
    subject,
    setSubject,
    message,
    setMessage
  } = useEmailTemplate({
    clientInfo,
    quoteOwnerName,
    ownerNameLoaded,
    selectedRecipientContact,
    transformedContacts,
    quoteNumber: quote.quoteNumber,
    quoteId: quote.id
  });

  const { isLoading, handleSendEmail } = useEmailSending({
    quote,
    clientInfo,
    quoteOwnerName,
    onEmailStatusChange,
    onClose
  });

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

  const onSendEmail = () => {
    handleSendEmail(recipientEmail, ccEmails, subject, message);
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
          onClick={onSendEmail}
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
