
import { useState, useEffect } from "react";
import { ClientInfo } from "@/pages/Index";

interface Contact {
  id: string;
  name: string;
  email: string;
  is_primary: boolean;
}

interface UseEmailTemplateProps {
  clientInfo?: ClientInfo;
  quoteOwnerName: string;
  ownerNameLoaded: boolean;
  selectedRecipientContact: string;
  transformedContacts: Contact[];
  quoteNumber?: string;
  quoteId: string;
}

export const useEmailTemplate = ({
  clientInfo,
  quoteOwnerName,
  ownerNameLoaded,
  selectedRecipientContact,
  transformedContacts,
  quoteNumber,
  quoteId
}: UseEmailTemplateProps) => {
  const [subject, setSubject] = useState(`Quote #${quoteNumber || quoteId.slice(0, 8)} - Service Agreement`);
  const [message, setMessage] = useState('');

  // Set the message template with the quote owner's name and selected contact name
  useEffect(() => {
    if (!ownerNameLoaded) {
      console.log('useEmailTemplate - Quote owner name not loaded yet, skipping message template update');
      return;
    }

    console.log('useEmailTemplate - Creating message template with quote owner:', quoteOwnerName);
    console.log('useEmailTemplate - Selected recipient contact:', selectedRecipientContact);
    
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
    
    console.log('useEmailTemplate - Using contact name for greeting:', contactName);

    const greeting = contactName ? `Hi ${contactName},` : 'Hi,';

    const messageTemplate = `${greeting}

Please find attached your quote for the requested services. If would like to proceed with this proposal click the green accept button on the PDF agreement. If you have any questions please don't hesitate to contact us.

Thank you for your business.

Best regards,
${quoteOwnerName}`;

    console.log('useEmailTemplate - Setting message template with greeting:', greeting);
    setMessage(messageTemplate);
  }, [clientInfo?.contact_name, quoteOwnerName, ownerNameLoaded, selectedRecipientContact, transformedContacts]);

  return {
    subject,
    setSubject,
    message,
    setMessage
  };
};
