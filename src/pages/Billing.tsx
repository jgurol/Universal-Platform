
import { NavigationBar } from "@/components/NavigationBar";
import { QuickNavigation } from "@/components/QuickNavigation";
import { Header } from "@/components/Header";
import { RecentTransactions } from "@/components/RecentTransactions";
import { AgentSummary } from "@/components/AgentSummary";
import { useIndexData } from "@/hooks/useIndexData";
import { useTransactionActions } from "@/hooks/useTransactionActions";
import { useAuth } from "@/context/AuthContext";

const Billing = () => {
  const { isAdmin } = useAuth();
  const {
    clients,
    quotes,
    clientInfos,
    associatedAgentId,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <QuickNavigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />
        
        {/* Agent Summary */}
        <div className="mb-8">
          <AgentSummary 
            clients={clients}
            quotes={quotes}
            allQuotes={quotes}
            isAdmin={isAdmin}
            activeFilter={null}
          />
        </div>
        
        {/* Recent Transactions */}
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
  );
};

export default Billing;
