
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, FileText, Clock } from "lucide-react";
import { Client, Quote, ClientInfo } from "@/pages/Index";

interface StatsCardsProps {
  clients: Client[];
  quotes: Quote[];
  clientInfos: ClientInfo[];
  isAdmin: boolean;
  associatedAgentId: string | null;
  onFilterChange: (filter: string | null) => void;
  activeFilter: string | null;
}

export const StatsCards = ({ 
  clients, 
  quotes, 
  clientInfos, 
  isAdmin, 
  associatedAgentId,
  onFilterChange,
  activeFilter
}: StatsCardsProps) => {
  const safeQuotes = quotes || [];
  
  // Calculate total commission from quotes
  const totalCommission = safeQuotes.reduce((sum, quote) => sum + (quote.commission || 0), 0);
  
  // Count different quote statuses
  const pendingQuotes = safeQuotes.filter(q => q.status === 'pending').length;
  const approvedQuotes = safeQuotes.filter(q => q.status === 'approved').length;
  
  // Count expired quotes
  const today = new Date();
  const expiredQuotes = safeQuotes.filter(q => q.expiresAt && new Date(q.expiresAt) < today).length;
  
  const handleFilterClick = (filter: string) => {
    if (activeFilter === filter) {
      onFilterChange(null);
    } else {
      onFilterChange(filter);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105" onClick={() => handleFilterClick('pending')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Pending Quotes</CardTitle>
          <Clock className={`h-4 w-4 ${activeFilter === 'pending' ? 'text-yellow-600' : 'text-yellow-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${activeFilter === 'pending' ? 'text-yellow-600' : 'text-gray-900'}`}>
            {pendingQuotes}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Awaiting approval
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105" onClick={() => handleFilterClick('approved')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Approved Quotes</CardTitle>
          <FileText className={`h-4 w-4 ${activeFilter === 'approved' ? 'text-green-600' : 'text-green-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${activeFilter === 'approved' ? 'text-green-600' : 'text-gray-900'}`}>
            {approvedQuotes}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Ready to proceed
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105" onClick={() => handleFilterClick('expired')}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Expired Quotes</CardTitle>
          <Clock className={`h-4 w-4 ${activeFilter === 'expired' ? 'text-red-600' : 'text-red-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${activeFilter === 'expired' ? 'text-red-600' : 'text-gray-900'}`}>
            {expiredQuotes}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Need renewal
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Commission</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            ${totalCommission.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            From {safeQuotes.length} quotes
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
