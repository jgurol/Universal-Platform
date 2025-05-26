
import { Quote } from "@/pages/Index";
import { FileText, TrendingUp, Users, DollarSign } from "lucide-react";

interface QuoteStatsProps {
  quotes: Quote[];
}

export const QuoteStats = ({ quotes }: QuoteStatsProps) => {
  const totalQuotes = quotes.length;
  const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
  const uniqueClients = new Set(quotes.map(q => q.clientInfoId).filter(Boolean)).size;
  const totalRevenue = quotes
    .filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + (q.amount || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Quotes</p>
            <p className="text-3xl font-bold text-gray-900">{totalQuotes}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-3xl font-bold text-green-600">{approvedQuotes}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Clients</p>
            <p className="text-3xl font-bold text-purple-600">{uniqueClients}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="text-3xl font-bold text-orange-600">
              ${totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-orange-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
