
import { ClientInfo } from "@/types/index";
import { ClientInfoList } from "@/components/ClientInfoList";

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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientInfoList
        clientInfos={clientInfos}
        onUpdateClientInfo={onUpdateClientInfo}
        agentMapping={agentMapping}
      />
    </div>
  );
};
