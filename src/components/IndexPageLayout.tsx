
import React, { useState } from "react";
import { NavigationBar } from "@/components/NavigationBar";
import { QuickNavigation } from "@/components/QuickNavigation";
import { AppAccessGrid } from "@/components/AppAccessGrid";
import { RecentQuotes } from "@/components/RecentQuotes";
import { RecentTransactions } from "@/components/RecentTransactions";
import { useAuth } from "@/context/AuthContext";
import { useIndexData } from "@/hooks/useIndexData";
import { useTransactionActions } from "@/hooks/useTransactionActions";

export const IndexPageLayout: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const {
    clients,
    quotes,
    clientInfos,
    isLoading,
    associatedAgentId,
    setQuotes,
    fetchQuotes
  } = useIndexData();

  const {
    addTransaction,
    updateTransaction,
    approveCommission,
    payCommission,
    deleteTransaction
  } = useTransactionActions(clients, fetchQuotes);

  // Convert quotes to transactions format for display
  const transactions = quotes.map(quote => ({
    id: quote.id,
    clientId: quote.clientId || '',
    clientName: quote.clientName || '',
    clientInfoId: quote.clientInfoId || '',
    amount: Number(quote.amount),
    date: quote.date,
    description: quote.description || '',
    invoiceNumber: quote.quoteNumber || '',
    invoiceMonth: quote.quoteMonth || '',
    invoiceYear: quote.quoteYear || '',
    isPaid: quote.status === 'approved',
    paymentMethod: '',
    referenceNumber: '',
    commissionOverride: quote.commissionOverride
  }));

  const handleAddQuote = (quote: any) => {
    // Add quote logic here
    console.log('Adding quote:', quote);
    fetchQuotes();
  };

  const handleUpdateQuote = (quote: any) => {
    // Update quote logic here
    console.log('Updating quote:', quote);
    fetchQuotes();
  };

  const handleDeleteQuote = (quoteId: string) => {
    // Delete quote logic here
    console.log('Deleting quote:', quoteId);
    fetchQuotes();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <NavigationBar />
        <QuickNavigation />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="ml-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <QuickNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}
          </h1>
          <p className="text-xl text-gray-600">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Programs Grid - Now using app access */}
        <AppAccessGrid />

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentQuotes 
            quotes={quotes}
            clients={clients}
            clientInfos={clientInfos}
            onAddQuote={handleAddQuote}
            onUpdateQuote={handleUpdateQuote}
            onDeleteQuote={handleDeleteQuote}
            associatedAgentId={associatedAgentId}
          />
          <RecentTransactions 
            transactions={transactions}
            clients={clients}
            clientInfos={clientInfos}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onApproveCommission={approveCommission}
            onPayCommission={payCommission}
            onDeleteTransaction={deleteTransaction}
            associatedAgentId={associatedAgentId}
          />
        </div>
      </div>
    </div>
  );
};
