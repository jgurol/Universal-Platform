
import { useState } from "react";
import { Header } from "@/components/Header";
import { ProgramsGrid } from "@/components/ProgramsGrid";
import { AddClientDialog } from "@/components/AddClientDialog";
import { Client, Quote, ClientInfo } from "@/pages/Index";
import { useAuth } from "@/context/AuthContext";

interface IndexPageLayoutProps {
  clients: Client[];
  quotes: Quote[];
  clientInfos: ClientInfo[];
  associatedAgentId: string | null;
  onAddClient: (client: Omit<Client, "id" | "totalEarnings" | "lastPayment">) => Promise<void>;
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  onUpdateQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
  onFetchClients: () => Promise<void>;
}

export const IndexPageLayout = ({
  clients,
  quotes,
  clientInfos,
  associatedAgentId,
  onAddClient,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  onFetchClients
}: IndexPageLayoutProps) => {
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <Header />

        {/* Programs Grid */}
        <ProgramsGrid />

        {/* Welcome Message */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard</h2>
            <p className="text-gray-600 mb-6">
              Select a program above to get started. Each application provides specialized tools and features 
              to help you manage different aspects of your business operations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Quick Access</h3>
                <p>Click on any program card to access its features and functionality.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Multi-Program</h3>
                <p>Switch between different programs seamlessly using the navigation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Dialog */}
      {isAdmin && (
        <AddClientDialog 
          open={isAddClientOpen}
          onOpenChange={setIsAddClientOpen}
          onAddClient={onAddClient}
          onFetchClients={onFetchClients}
        />
      )}
    </div>
  );
};
