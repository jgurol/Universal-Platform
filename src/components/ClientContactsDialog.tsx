
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
  const { contacts, addContact, updateContact, deleteContact } = useClientContacts(clientId);

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
            onAddContact={addContact}
            onUpdateContact={updateContact}
            onDeleteContact={deleteContact}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
