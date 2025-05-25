
import { useState } from "react";
import { NavigationBar } from "@/components/NavigationBar";
import { Header } from "@/components/Header";
import { ClientManagementHeader } from "@/components/ClientManagementHeader";
import { ClientManagementContent } from "@/components/ClientManagementContent";
import { AddClientInfoDialog } from "@/components/AddClientInfoDialog";
import { useClientManagement } from "@/hooks/useClientManagement";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

const ClientManagement = () => {
  const [isAddClientInfoOpen, setIsAddClientInfoOpen] = useState(false);
  
  const {
    clientInfos,
    isLoading,
    agentMapping,
    addClientInfo,
    updateClientInfo
  } = useClientManagement();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Dashboard Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Management</h1>
            <p className="text-gray-600">Manage your clients' information and details</p>
          </div>
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
        
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
