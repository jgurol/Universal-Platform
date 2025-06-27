
import React, { useState } from "react";
import { NavigationBar } from "@/components/NavigationBar";
import { Header } from "@/components/Header";
import { ProgramsGrid } from "@/components/ProgramsGrid";
import { StatsCards } from "@/components/StatsCards";
import { RecentQuotes } from "@/components/RecentQuotes";
import { RecentTransactions } from "@/components/RecentTransactions";
import { CommissionChart } from "@/components/CommissionChart";
import { AgentSummary } from "@/components/AgentSummary";
import { useIndexData } from "@/hooks/useIndexData";
import { useAuth } from "@/context/AuthContext";
import { useQuoteActions } from "@/hooks/useQuoteActions";
import { useTransactionActions } from "@/hooks/useTransactionActions";
import { useClientActions } from "@/hooks/useClientActions";

export const IndexPageLayout = () => {
  const { user, isAdmin } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
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

  const { addClient, updateClient, deleteClient } = useClientActions(
    clients,
    setClients,
    fetchClients
  );

  const {
    addQuote,
    updateQuote,
    deleteQuote,
    unarchiveQuote,
    permanentlyDeleteQuote
  } = useQuoteActions(quotes, setQuotes, fetchQuotes);

  const {
    transactions,
    addTransaction,
    updateTransaction,
    approveCommission,
    payCommission,
    deleteTransaction
  } = useTransactionActions();

  // Filter quotes based on active filter
  const filteredQuotes = activeFilter 
    ? quotes.filter(quote => {
        switch (activeFilter) {
          case 'pending':
            return quote.status === 'pending';
          case 'approved':
            return quote.status === 'approved';
          case 'expired':
            const today = new Date();
            return quote.expiresAt && new Date(quote.expiresAt) < today;
          default:
            return true;
        }
      })
    : quotes;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <Header />
        <StatsCards 
          clients={clients}
          quotes={filteredQuotes}
          clientInfos={clientInfos}
          isAdmin={isAdmin}
          associatedAgentId={associatedAgentId}
          onFilterChange={setActiveFilter}
          activeFilter={activeFilter}
        />
        <ProgramsGrid />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <RecentQuotes 
            quotes={filteredQuotes}
            clients={clients}
            clientInfos={clientInfos}
            onAddQuote={addQuote}
            onUpdateQuote={updateQuote}
            onDeleteQuote={deleteQuote}
            onUnarchiveQuote={unarchiveQuote}
            onPermanentlyDeleteQuote={permanentlyDeleteQuote}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <CommissionChart quotes={filteredQuotes} />
          <AgentSummary 
            clients={clients}
            quotes={filteredQuotes}
            allQuotes={quotes}
            isAdmin={isAdmin}
            activeFilter={activeFilter}
          />
        </div>
      </div>
    </div>
  );
};
