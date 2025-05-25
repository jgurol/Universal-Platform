
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
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <ClientInfoList 
      clientInfos={clientInfos}
      onUpdateClientInfo={onUpdateClientInfo}
      agentMapping={agentMapping}
    />
  );
};
