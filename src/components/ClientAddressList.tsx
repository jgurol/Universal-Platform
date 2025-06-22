
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, MapPin, Plus, Trash2, Crown } from "lucide-react";
import { ClientAddress, AddClientAddressData, UpdateClientAddressData } from "@/types/clientAddress";
import { AddAddressDialog } from "@/components/AddAddressDialog";
import { EditAddressDialog } from "@/components/EditAddressDialog";

interface ClientAddressListProps {
  addresses: ClientAddress[];
  clientInfoId: string;
  onAddAddress: (address: AddClientAddressData) => Promise<ClientAddress>;
  onUpdateAddress: (address: UpdateClientAddressData) => Promise<void>;
  onDeleteAddress: (addressId: string) => Promise<void>;
}

export const ClientAddressList = ({ 
  addresses, 
  clientInfoId, 
  onAddAddress, 
  onUpdateAddress, 
  onDeleteAddress 
}: ClientAddressListProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ClientAddress | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const formatAddress = (address: ClientAddress) => {
    const addressLine1 = address.street_address;
    const addressLine2 = address.street_address_2 ? `, ${address.street_address_2}` : '';
    return `${addressLine1}${addressLine2}, ${address.city}, ${address.state} ${address.zip_code}${address.country !== 'United States' ? `, ${address.country}` : ''}`;
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case 'billing': return 'bg-blue-100 text-blue-800';
      case 'shipping': return 'bg-green-100 text-green-800';
      case 'mailing': return 'bg-purple-100 text-purple-800';
      case 'office': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Addresses
        </h3>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No addresses added yet. Click "Add Address" to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_primary ? "border-green-200 bg-green-50" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Badge className={getAddressTypeColor(address.address_type)}>
                      {address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)}
                    </Badge>
                    {address.is_primary && (
                      <Badge variant="default" className="bg-green-600 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAddress(address)}
                      className="hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog open={deletingAddressId === address.id} onOpenChange={(open) => !open && setDeletingAddressId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingAddressId(address.id)}
                          className="hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will permanently delete this address and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              onDeleteAddress(address.id);
                              setDeletingAddressId(null);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600">{formatAddress(address)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddAddressDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddAddress={onAddAddress}
        clientInfoId={clientInfoId}
      />

      {editingAddress && (
        <EditAddressDialog
          address={editingAddress}
          open={!!editingAddress}
          onOpenChange={(open) => !open && setEditingAddress(null)}
          onUpdateAddress={onUpdateAddress}
        />
      )}
    </div>
  );
};
