
import { NavigationBar } from "@/components/NavigationBar";
import { QuickNavigation } from "@/components/QuickNavigation";
import { Header } from "@/components/Header";
import { TransactionCard } from "@/components/TransactionCard";
import { RecentTransactions } from "@/components/RecentTransactions";
import { AgentSummary } from "@/components/AgentSummary";

const Billing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <QuickNavigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />
        
        {/* Agent Summary */}
        <AgentSummary />
        
        {/* Transaction Management */}
        <TransactionCard />
        
        {/* Recent Transactions */}
        <RecentTransactions />
      </div>
    </div>
  );
};

export default Billing;
