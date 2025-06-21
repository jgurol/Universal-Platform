
import { useState } from "react";
import { Header } from "@/components/Header";
import { NavigationBar } from "@/components/NavigationBar";
import { DealRegistrationCard } from "@/components/DealRegistrationCard";
import { ClientManagementHeader } from "@/components/ClientManagementHeader";
import { ClientManagementContent } from "@/components/ClientManagementContent";
import { AddClientInfoDialog } from "@/components/AddClientInfoDialog";
import { useClientManagement } from "@/hooks/useClientManagement";

const DealRegistration = () => {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const { clientInfos, agentMapping, isLoading, addClientInfo, updateClientInfo } = useClientManagement();

  const handleAddClient = () => {
    setIsAddClientOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />
        
        {/* Client Management Section */}
        <ClientManagementHeader onAddClient={handleAddClient} />
        <ClientManagementContent 
          clientInfos={clientInfos}
          isLoading={isLoading}
          agentMapping={agentMapping}
          onUpdateClientInfo={updateClientInfo}
        />
        
        {/* Deal Registration Section */}
        <div className="mt-8">
          <DealRegistrationCard 
            clientInfos={clientInfos}
            agentMapping={agentMapping}
          />
        </div>

        {/* Add Client Dialog */}
        <AddClientInfoDialog
          open={isAddClientOpen}
          onOpenChange={setIsAddClientOpen}
          onAddClientInfo={addClientInfo}
        />
      </div>
    </div>
  );
};

export default DealRegistration;
