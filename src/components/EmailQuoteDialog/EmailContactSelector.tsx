
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ClientInfo } from "@/pages/Index";

interface Contact {
  id: string;
  name: string;
  email: string;
  is_primary: boolean;
}

interface EmailContactSelectorProps {
  contacts: Contact[];
  contactsLoading: boolean;
  selectedRecipientContact: string;
  onRecipientContactChange: (value: string) => void;
  customRecipientEmail: string;
  onCustomRecipientEmailChange: (value: string) => void;
  clientInfo?: ClientInfo;
}

export const EmailContactSelector = ({
  contacts,
  contactsLoading,
  selectedRecipientContact,
  onRecipientContactChange,
  customRecipientEmail,
  onCustomRecipientEmailChange,
  clientInfo
}: EmailContactSelectorProps) => {
  // Only show contacts that have email addresses and belong to this client
  const availableContacts = contacts.filter(contact => 
    contact.email && contact.email.trim() !== ''
  );

  const handleValueChange = (value: string) => {
    console.log('EmailContactSelector - Selected value:', value);
    onRecipientContactChange(value);
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="recipientSelect">Send To *</Label>
        {contactsLoading ? (
          <div className="text-sm text-gray-500">Loading contacts...</div>
        ) : (
          <Select value={selectedRecipientContact} onValueChange={handleValueChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom Email</SelectItem>
              {/* Show client info as an option only if we have contact name and email and no contacts exist */}
              {clientInfo?.contact_name && clientInfo?.email && availableContacts.length === 0 && (
                <SelectItem value="client-info">
                  {clientInfo.contact_name} ({clientInfo.email}) - Primary Contact
                </SelectItem>
              )}
              {availableContacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name} ({contact.email}) {contact.is_primary && '- Primary'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedRecipientContact === "custom" && (
        <div className="space-y-2">
          <Label htmlFor="customEmail">Custom Email Address(es) *</Label>
          <Input
            id="customEmail"
            type="email"
            value={customRecipientEmail}
            onChange={(e) => onCustomRecipientEmailChange(e.target.value)}
            placeholder="Enter email address(es) separated by commas"
            required
          />
          <div className="text-sm text-gray-500">
            Enter one or more email addresses separated by commas (e.g., email1@example.com, email2@example.com)
          </div>
        </div>
      )}
    </>
  );
};
