
import { ClientInfoList } from "@/components/ClientInfoList";
import { ClientInfo } from "@/pages/Index";

interface ClientManagementContentProps {
  clientInfos: ClientInfo[];
  isLoading: boolean;
  agentMapping: Record<string, string>;
  onUpdateClientInfo: (clientInfo: ClientInfo) => void;
}

export const ClientManagementContent = ({
  clientInfos,
  isLoading,
  agentMapping,
  onUpdateClientInfo
}: ClientManagementContentProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Client Info List */}
      <ClientInfoList 
        clientInfos={clientInfos}
        onUpdateClientInfo={onUpdateClientInfo}
        agentMapping={agentMapping}
      />
    </div>
  );
};
