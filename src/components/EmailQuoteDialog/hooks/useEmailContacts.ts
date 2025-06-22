
import { useState, useEffect } from "react";
import { ClientInfo } from "@/pages/Index";

interface Contact {
  id: string;
  name: string;
  email: string;
  is_primary: boolean;
}

interface UseEmailContactsProps {
  transformedContacts: Contact[];
  clientInfo?: ClientInfo;
}

export const useEmailContacts = ({ transformedContacts, clientInfo }: UseEmailContactsProps) => {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [selectedRecipientContact, setSelectedRecipientContact] = useState<string>("custom");
  const [selectedCcContacts, setSelectedCcContacts] = useState<string[]>([]);
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");

  // Set primary contact as default recipient when component mounts
  useEffect(() => {
    // First, check if we have client info with contact name and email - prioritize this
    if (clientInfo?.contact_name && clientInfo?.email) {
      console.log('useEmailContacts - Using client info as primary contact:', clientInfo);
      setSelectedRecipientContact("client-info");
      setRecipientEmail(clientInfo.email);
    } else if (transformedContacts.length > 0) {
      console.log('useEmailContacts - Setting up recipient from contacts:', transformedContacts);
      const primaryContact = transformedContacts.find(contact => contact.is_primary);
      if (primaryContact?.email) {
        console.log('useEmailContacts - Found primary contact:', primaryContact);
        setSelectedRecipientContact(primaryContact.id);
        setRecipientEmail(primaryContact.email);
      } else {
        // If no primary contact with email, use first contact with email
        const firstContactWithEmail = transformedContacts.find(contact => contact.email);
        if (firstContactWithEmail) {
          console.log('useEmailContacts - Using first contact with email:', firstContactWithEmail);
          setSelectedRecipientContact(firstContactWithEmail.id);
          setRecipientEmail(firstContactWithEmail.email);
        } else if (clientInfo?.email) {
          console.log('useEmailContacts - Using client info email:', clientInfo.email);
          setRecipientEmail(clientInfo.email);
          setCustomRecipientEmail(clientInfo.email);
        }
      }
    } else if (clientInfo?.email) {
      console.log('useEmailContacts - No contacts, using client info email:', clientInfo.email);
      setRecipientEmail(clientInfo.email);
      setCustomRecipientEmail(clientInfo.email);
    }
  }, [transformedContacts, clientInfo]);

  // Update recipient email when contact selection changes
  useEffect(() => {
    if (selectedRecipientContact === "custom") {
      setRecipientEmail(customRecipientEmail);
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

  return {
    recipientEmail,
    ccEmails,
    selectedRecipientContact,
    setSelectedRecipientContact,
    selectedCcContacts,
    customRecipientEmail,
    setCustomRecipientEmail,
    handleCcContactToggle,
    removeCcEmail
  };
};
