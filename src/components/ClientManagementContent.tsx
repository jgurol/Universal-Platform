
import { useState } from "react";
import { ClientInfo } from "@/pages/Index";
import { ClientInfoList } from "@/components/ClientInfoList";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading clients...</div>
      </div>
    );
  }

  // Filter clients based on search term
  const filteredClients = clientInfos.filter(client => 
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.revio_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar - Centered and Prominent */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search clients by name, notes, or Revio ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-center"
          />
        </div>
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-sm text-gray-600 text-center">
          {filteredClients.length === 1 
            ? "1 client found" 
            : `${filteredClients.length} clients found`}
        </div>
      )}

      <ClientInfoList
        clientInfos={filteredClients}
        onUpdateClientInfo={onUpdateClientInfo}
        agentMapping={agentMapping}
      />
    </div>
  );
};
