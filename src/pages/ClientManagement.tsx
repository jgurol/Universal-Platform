
import { useState } from "react";
import { Header } from "@/components/Header";
import { ClientManagementHeader } from "@/components/ClientManagementHeader";
import { ClientManagementContent } from "@/components/ClientManagementContent";
import { AddClientInfoDialog } from "@/components/AddClientInfoDialog";
import { useClientManagement } from "@/hooks/useClientManagement";

const ClientManagement = () => {
  const [isAddClientInfoOpen, setIsAddClientInfoOpen] = useState(false);
  
  const {
    clientInfos,
    isLoading,
    agentMapping,
    addClientInfo,
    updateClientInfo
  } = useClientManagement();

  console.log("=== CLIENT MANAGEMENT PAGE DEBUG ===");
  console.log("Hook returned data:");
  console.log("- clientInfos:", clientInfos);
  console.log("- clientInfos.length:", clientInfos.length);
  console.log("- isLoading:", isLoading);
  console.log("- agentMapping:", agentMapping);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />
        
        <ClientManagementHeader onAddClient={() => setIsAddClientInfoOpen(true)} />
        
        <div className="bg-white shadow-lg border-0 rounded-lg p-6 -mt-6 relative z-10">
          <ClientManagementContent
            clientInfos={clientInfos}
            isLoading={isLoading}
            agentMapping={agentMapping}
            onUpdateClientInfo={updateClientInfo}
          />
        </div>

        <AddClientInfoDialog
          open={isAddClientInfoOpen}
          onOpenChange={setIsAddClientInfoOpen}
          onAddClientInfo={addClientInfo}
        />
      </div>
    </div>
  );
};

export default ClientManagement;
