
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientAddressList } from "@/components/ClientAddressList";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { MapPin } from "lucide-react";

interface ClientLocationsDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClientLocationsDialog = ({ 
  clientId, 
  open, 
  onOpenChange 
}: ClientLocationsDialogProps) => {
  const { addresses, addAddress, updateAddress, deleteAddress } = useClientAddresses(clientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Client Locations
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <ClientAddressList
            addresses={addresses}
            clientInfoId={clientId}
            onAddAddress={addAddress}
            onUpdateAddress={updateAddress}
            onDeleteAddress={deleteAddress}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
