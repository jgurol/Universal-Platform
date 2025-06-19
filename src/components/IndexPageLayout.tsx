
import { useState } from "react";
import { NavigationBar } from "@/components/NavigationBar";
import { Header } from "@/components/Header";
import { ProgramsGrid } from "@/components/ProgramsGrid";
import { AddClientDialog } from "@/components/AddClientDialog";
import { Client, Quote, ClientInfo } from "@/types/index";
import { useAuth } from "@/context/AuthContext";

export const IndexPageLayout = () => {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const { isAdmin } = useAuth();

  // Placeholder functions for now - these will be implemented when the full dashboard functionality is needed
  const handleAddClient = async (client: Omit<Client, "id" | "totalEarnings" | "lastPayment">) => {
    console.log('Add client:', client);
  };

  const handleFetchClients = async () => {
    console.log('Fetch clients');
  };

  return (
    <>
      <NavigationBar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <Header />

          {/* Programs Grid */}
          <ProgramsGrid />
        </div>

        {/* Add Client Dialog */}
        {isAdmin && (
          <AddClientDialog 
            open={isAddClientOpen}
            onOpenChange={setIsAddClientOpen}
            onAddClient={handleAddClient}
            onFetchClients={handleFetchClients}
          />
        )}
      </div>
    </>
  );
};
