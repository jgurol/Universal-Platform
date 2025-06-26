
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientContactsList } from "@/components/ClientContactsList";
import { useClientContacts } from "@/hooks/useClientContacts";
import { User } from "lucide-react";

interface ClientContactsDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClientContactsDialog = ({ 
  clientId, 
  open, 
  onOpenChange 
}: ClientContactsDialogProps) => {
  console.log('ClientContactsDialog - clientId:', clientId);
  
  const { contacts, addContact, updateContact, deleteContact } = useClientContacts(clientId);

  const handleAddContact = async (contactData: any) => {
    try {
      console.log('Adding contact for clientId:', clientId, 'with data:', contactData);
      await addContact(contactData);
    } catch (error) {
      console.error('Error in handleAddContact:', error);
    }
  };

  const handleUpdateContact = async (contactData: any) => {
    try {
      await updateContact(contactData);
    } catch (error) {
      console.error('Error in handleUpdateContact:', error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId);
    } catch (error) {
      console.error('Error in handleDeleteContact:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Client Contacts
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <ClientContactsList
            contacts={contacts}
            clientInfoId={clientId}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
