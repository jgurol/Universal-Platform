
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
}

export const EmailContactSelector = ({
  contacts,
  contactsLoading,
  selectedRecipientContact,
  onRecipientContactChange,
  customRecipientEmail,
  onCustomRecipientEmailChange
}: EmailContactSelectorProps) => {
  const availableContacts = contacts.filter(contact => contact.email);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="recipientSelect">Send To *</Label>
        {contactsLoading ? (
          <div className="text-sm text-gray-500">Loading contacts...</div>
        ) : (
          <Select value={selectedRecipientContact} onValueChange={onRecipientContactChange}>
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
        )}
      </div>

      {selectedRecipientContact === "custom" && (
        <div className="space-y-2">
          <Label htmlFor="customEmail">Custom Email Address *</Label>
          <Input
            id="customEmail"
            type="email"
            value={customRecipientEmail}
            onChange={(e) => onCustomRecipientEmailChange(e.target.value)}
            placeholder="Enter custom email address"
            required
          />
        </div>
      )}
    </>
  );
};
