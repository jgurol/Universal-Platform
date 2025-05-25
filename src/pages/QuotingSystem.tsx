
import { useState } from "react";
import { Header } from "@/components/Header";
import { RecentQuotes } from "@/components/RecentQuotes";
import { ItemsManagement } from "@/components/ItemsManagement";
import { CategoriesManagement } from "@/components/CategoriesManagement";
import { VendorsManagement } from "@/components/VendorsManagement";
import { useIndexData } from "@/hooks/useIndexData";
import { useQuoteActions } from "@/hooks/useQuoteActions";
import { useClientActions } from "@/hooks/useClientActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QuotingSystem = () => {
  const {
    clients,
    setClients,
    quotes,
    setQuotes,
    clientInfos,
    setClientInfos,
    isLoading,
    associatedAgentId,
    fetchClients,
    fetchQuotes,
    fetchClientInfos
  } = useIndexData();

  const {
    addQuote,
    updateQuote,
    deleteQuote
  } = useQuoteActions(clients, fetchQuotes);

  const { addClient } = useClientActions(clients, setClients, fetchClients);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <Header />

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quoting System</h1>
          <p className="text-gray-600">Create and manage quotes for your clients</p>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="quotes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="items">Items & Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quotes" className="mt-6">
            <RecentQuotes
              quotes={quotes}
              clients={clients}
              clientInfos={clientInfos}
              onAddQuote={addQuote}
              onUpdateQuote={updateQuote}
              onDeleteQuote={deleteQuote}
              associatedAgentId={associatedAgentId}
            />
          </TabsContent>
          
          <TabsContent value="items" className="mt-6">
            <ItemsManagement />
          </TabsContent>
          
          <TabsContent value="categories" className="mt-6">
            <CategoriesManagement />
          </TabsContent>
          
          <TabsContent value="vendors" className="mt-6">
            <VendorsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QuotingSystem;
