
import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, MapPin, Trash2, Users, Mail, User } from "lucide-react";
import { ClientInfo } from "@/pages/Index";
import { EditClientInfoDialog } from "@/components/EditClientInfoDialog";
import { ClientAddressList } from "@/components/ClientAddressList";
import { ClientContactsList } from "@/components/ClientContactsList";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { useClientContacts } from "@/hooks/useClientContacts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientInfoListProps {
  clientInfos: ClientInfo[];
  onUpdateClientInfo: (clientInfo: ClientInfo) => void;
  agentMapping?: Record<string, string>;
}

export const ClientInfoList = ({ clientInfos, onUpdateClientInfo, agentMapping = {} }: ClientInfoListProps) => {
  const [editingClientInfo, setEditingClientInfo] = useState<ClientInfo | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [viewingAddressesClientId, setViewingAddressesClientId] = useState<string | null>(null);
  const [viewingContactsClientId, setViewingContactsClientId] = useState<string | null>(null);
  const { toast } = useToast();

  const { 
    addresses, 
    addAddress, 
    updateAddress, 
    deleteAddress 
  } = useClientAddresses(viewingAddressesClientId);

  const {
    contacts,
    addContact,
    updateContact,
    deleteContact
  } = useClientContacts(viewingContactsClientId);

  console.log("ClientInfoList received clientInfos:", clientInfos);
  console.log("ClientInfoList received agentMapping:", agentMapping);

  const handleDelete = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('client_info')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Error deleting client info:', error);
        toast({
          title: "Failed to delete client",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Client deleted",
          description: "Client has been deleted successfully.",
          variant: "default"
        });
        
        // Update the client list in the parent component
        onUpdateClientInfo({
          ...clientInfos.find(client => client.id === clientId)!, 
          _delete: true
        } as any);
      }
    } catch (err) {
      console.error('Error in delete operation:', err);
      toast({
        title: "Error",
        description: "Failed to delete client information",
        variant: "destructive"
      });
    }
    setDeletingClientId(null);
  };

  const getSalespersonName = (agentId: string | null) => {
    if (!agentId || agentId === "none") return "-";
    return agentMapping[agentId] || "Unknown salesperson";
  };

  const selectedClient = viewingAddressesClientId 
    ? clientInfos.find(client => client.id === viewingAddressesClientId)
    : null;

  const selectedContactsClient = viewingContactsClientId
    ? clientInfos.find(client => client.id === viewingContactsClientId)
    : null;

  return (
    <>
      {clientInfos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No clients added yet. Click "Add Client" to get started!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Revio ID</TableHead>
                <TableHead>Associated Salesperson</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientInfos.map((clientInfo) => (
                <TableRow key={clientInfo.id}>
                  <TableCell className="font-medium">{clientInfo.company_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {clientInfo.contact_name ? (
                        <>
                          <User className="w-4 h-4 text-gray-400" />
                          {clientInfo.contact_name}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {clientInfo.email ? (
                        <>
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a href={`mailto:${clientInfo.email}`} className="text-blue-600 hover:underline">
                            {clientInfo.email}
                          </a>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{clientInfo.phone || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{clientInfo.revio_id || "-"}</TableCell>
                  <TableCell>{getSalespersonName(clientInfo.agent_id)}</TableCell>
                  <TableCell>{new Date(clientInfo.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingContactsClientId(clientInfo.id)}
                        className="hover:bg-green-50 hover:border-green-300"
                        title="Manage Contacts"
                      >
                        <Users className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingAddressesClientId(clientInfo.id)}
                        className="hover:bg-purple-50 hover:border-purple-300"
                        title="Manage Addresses"
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingClientInfo(clientInfo)}
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog open={deletingClientId === clientInfo.id} onOpenChange={(open) => !open && setDeletingClientId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingClientId(clientInfo.id)}
                            className="hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently delete the client "{clientInfo.company_name}" and all associated addresses. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(clientInfo.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editingClientInfo && (
        <EditClientInfoDialog
          clientInfo={editingClientInfo}
          open={!!editingClientInfo}
          onOpenChange={(open) => !open && setEditingClientInfo(null)}
          onUpdateClientInfo={onUpdateClientInfo}
        />
      )}

      <Dialog open={!!viewingAddressesClientId} onOpenChange={(open) => !open && setViewingAddressesClientId(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Addresses - {selectedClient?.company_name}
            </DialogTitle>
          </DialogHeader>
          <ClientAddressList
            addresses={addresses}
            clientInfoId={viewingAddressesClientId!}
            onAddAddress={addAddress}
            onUpdateAddress={updateAddress}
            onDeleteAddress={deleteAddress}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingContactsClientId} onOpenChange={(open) => !open && setViewingContactsClientId(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Contacts - {selectedContactsClient?.company_name}
            </DialogTitle>
          </DialogHeader>
          <ClientContactsList
            clientInfoId={viewingContactsClientId!}
            onAddContact={addContact}
            onUpdateContact={updateContact}
            onDeleteContact={deleteContact}
            contacts={contacts}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
