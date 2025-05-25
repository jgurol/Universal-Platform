
import { useState } from "react";
import { NavigationBar } from "@/components/NavigationBar";
import { Header } from "@/components/Header";
import { RecentQuotes } from "@/components/RecentQuotes";
import { ItemsManagement } from "@/components/ItemsManagement";
import { CategoriesManagement } from "@/components/CategoriesManagement";
import { VendorsManagement } from "@/components/VendorsManagement";
import { useIndexData } from "@/hooks/useIndexData";
import { useQuoteActions } from "@/hooks/useQuoteActions";
import { useClientActions } from "@/hooks/useClientActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

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
      <NavigationBar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Dashboard Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quoting System</h1>
            <p className="text-gray-600">Create and manage quotes for your clients</p>
          </div>
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
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
