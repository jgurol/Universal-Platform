
import { useState } from "react";
import { ClientInfo } from "@/pages/Index";
import { ClientInfoList } from "@/components/ClientInfoList";
import { ClientAddressManagement } from "@/components/ClientAddressManagement";
import { Button } from "@/components/ui/button";
import { Building, MapPin } from "lucide-react";

interface ClientManagementContentProps {
  clientInfos: ClientInfo[];
  isLoading: boolean;
  agentMapping: Record<string, string>;
  onUpdateClientInfo: (clientInfo: ClientInfo) => Promise<void>;
}

export const ClientManagementContent = ({ 
  clientInfos, 
  isLoading, 
  agentMapping, 
  onUpdateClientInfo 
}: ClientManagementContentProps) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'addresses'>('clients');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <Button
          variant={activeTab === 'clients' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('clients')}
          className="flex items-center gap-2"
        >
          <Building className="w-4 h-4" />
          Clients
        </Button>
        <Button
          variant={activeTab === 'addresses' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('addresses')}
          className="flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          Locations
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'clients' && (
        <ClientInfoList
          clientInfos={clientInfos}
          onUpdateClientInfo={onUpdateClientInfo}
          agentMapping={agentMapping}
        />
      )}

      {activeTab === 'addresses' && (
        <ClientAddressManagement
          clientInfos={clientInfos}
        />
      )}
    </div>
  );
};
