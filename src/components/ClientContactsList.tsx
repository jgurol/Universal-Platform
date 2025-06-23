
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, User, Crown, Mail, Phone } from "lucide-react";
import { ClientContact } from "@/types/clientContacts";
import { AddClientContactDialog } from "@/components/AddClientContactDialog";
import { EditClientContactDialog } from "@/components/EditClientContactDialog";
import { useClientContacts } from "@/hooks/useClientContacts";

interface ClientContactsListProps {
  clientInfoId: string;
  onAddContact: (contactData: any) => Promise<void>;
  onUpdateContact: (contactData: any) => Promise<void>;
  onDeleteContact: (contactId: string) => Promise<void>;
  contacts: ClientContact[];
}

export const ClientContactsList = ({ 
  clientInfoId,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  contacts: propContacts
}: ClientContactsListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const { setPrimaryContact } = useClientContacts(clientInfoId);

  // Use contacts from props consistently
  const contacts = propContacts;

  const handleDelete = async (contactId: string) => {
    await onDeleteContact(contactId);
    setDeletingContactId(null);
  };

  const handleSetPrimary = async (contactId: string) => {
    await setPrimaryContact(contactId);
  };

  const handleAddContact = async (contactData: any) => {
    await onAddContact(contactData);
  };

  const handleUpdateContact = async (contactData: any) => {
    await onUpdateContact(contactData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contacts</h3>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No contacts added yet. Click "Add Contact" to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">
                    {contact.first_name} {contact.last_name}
                  </h4>
                  {contact.is_primary && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Crown className="w-3 h-3 mr-1" />
                      Primary
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  {contact.title && (
                    <p className="text-sm text-gray-600 font-medium">{contact.title}</p>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {!contact.is_primary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetPrimary(contact.id)}
                    className="hover:bg-yellow-50 hover:border-yellow-300 text-yellow-600 hover:text-yellow-700"
                    title="Set as Primary Contact"
                  >
                    <Crown className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingContact(contact)}
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <AlertDialog open={deletingContactId === contact.id} onOpenChange={(open) => !open && setDeletingContactId(null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingContactId(contact.id)}
                      className="hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete the contact "{contact.first_name} {contact.last_name}". This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(contact.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddClientContactDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddContact={handleAddContact}
      />

      <EditClientContactDialog
        contact={editingContact}
        open={!!editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
        onUpdateContact={handleUpdateContact}
      />
    </div>
  );
};
