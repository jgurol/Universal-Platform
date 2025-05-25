
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  is_primary: boolean;
}

interface CCContactSelectorProps {
  contacts: Contact[];
  selectedRecipientContact: string;
  selectedCcContacts: string[];
  onCcContactToggle: (contactId: string, checked: boolean) => void;
  ccEmails: string[];
  onRemoveCcEmail: (email: string) => void;
}

export const CCContactSelector = ({
  contacts,
  selectedRecipientContact,
  selectedCcContacts,
  onCcContactToggle,
  ccEmails,
  onRemoveCcEmail
}: CCContactSelectorProps) => {
  const availableContacts = contacts.filter(contact => contact.email);

  return (
    <>
      {availableContacts.length > 0 && (
        <div className="space-y-2">
          <Label>CC Recipients (Optional)</Label>
          <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
            {availableContacts
              .filter(contact => contact.id !== selectedRecipientContact)
              .map((contact) => (
                <div key={contact.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cc-${contact.id}`}
                    checked={selectedCcContacts.includes(contact.id)}
                    onCheckedChange={(checked) => onCcContactToggle(contact.id, checked === true)}
                  />
                  <Label htmlFor={`cc-${contact.id}`} className="text-sm">
                    {contact.name} ({contact.email}) {contact.is_primary && '- Primary'}
                  </Label>
                </div>
              ))}
            {availableContacts.filter(contact => contact.id !== selectedRecipientContact).length === 0 && (
              <p className="text-sm text-gray-500">No additional contacts available for CC</p>
            )}
          </div>
        </div>
      )}

      {ccEmails.length > 0 && (
        <div className="space-y-2">
          <Label>CC Email Addresses</Label>
          <div className="flex flex-wrap gap-2">
            {ccEmails.map((email) => (
              <div key={email} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                {email}
                <button
                  type="button"
                  onClick={() => onRemoveCcEmail(email)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
