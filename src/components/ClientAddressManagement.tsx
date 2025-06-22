
import { useState } from "react";
import { ClientInfo } from "@/pages/Index";
import { ClientAddressList } from "@/components/ClientAddressList";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Building } from "lucide-react";

interface ClientAddressManagementProps {
  clientInfos: ClientInfo[];
}

export const ClientAddressManagement = ({ clientInfos }: ClientAddressManagementProps) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { addresses, addAddress, updateAddress, deleteAddress } = useClientAddresses(selectedClientId);

  const selectedClient = clientInfos.find(client => client.id === selectedClientId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Client Locations Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">Select Client</Label>
              <Select 
                value={selectedClientId || ""} 
                onValueChange={(value) => setSelectedClientId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client to manage their locations" />
                </SelectTrigger>
                <SelectContent>
                  {clientInfos.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {client.company_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClient && (
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">
                  Locations for {selectedClient.company_name}
                </h3>
                <ClientAddressList
                  addresses={addresses}
                  clientInfoId={selectedClientId!}
                  onAddAddress={addAddress}
                  onUpdateAddress={updateAddress}
                  onDeleteAddress={deleteAddress}
                />
              </div>
            )}

            {!selectedClientId && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a client above to view and manage their locations</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
