
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, Users } from "lucide-react";
import { Client, Quote } from "@/types/index";

interface AgentSummaryProps {
  clients: Client[];
  quotes: Quote[];
  allQuotes: Quote[];
  isAdmin: boolean;
  activeFilter: string | null;
}

export const AgentSummary = ({ clients, quotes, allQuotes, isAdmin, activeFilter }: AgentSummaryProps) => {
  const safeQuotes = quotes || [];
  const safeAllQuotes = allQuotes || [];
  
  // Calculate summary stats from quotes
  const totalCommission = safeQuotes.reduce((sum, quote) => sum + (Number(quote.commission) || 0), 0);
  const avgQuoteValue = safeQuotes.length > 0 
    ? safeQuotes.reduce((sum, quote) => sum + Number(quote.amount || 0), 0) / safeQuotes.length 
    : 0;
  
  // Get top performing agent from all quotes
  const agentPerformance = safeAllQuotes.reduce((acc, quote) => {
    if (!acc[quote.clientName]) {
      acc[quote.clientName] = 0;
    }
    acc[quote.clientName] += Number(quote.commission) || 0;
    return acc;
  }, {} as Record<string, number>);
  
  const topAgent = Object.entries(agentPerformance)
    .sort(([,a], [,b]) => Number(b) - Number(a))[0];
  
  const getFilterLabel = () => {
    switch (activeFilter) {
      case 'pending': return 'Pending Quotes';
      case 'approved': return 'Approved Quotes'; 
      case 'expired': return 'Expired Quotes';
      case 'active': return 'Active Quotes';
      default: return 'All Quotes';
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Quote Summary
        </CardTitle>
        <CardDescription>
          {activeFilter ? `Performance metrics for ${getFilterLabel()}` : 'Overall quote performance metrics'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Commission */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Total Commission</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            ${totalCommission.toLocaleString()}
          </span>
        </div>

        {/* Average Quote Value */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Avg Quote Value</span>
          </div>
          <span className="text-lg font-bold text-blue-600">
            ${avgQuoteValue.toLocaleString()}
          </span>
        </div>

        {/* Quote Count */}
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Total Quotes</span>
          </div>
          <span className="text-lg font-bold text-purple-600">
            {safeQuotes.length}
          </span>
        </div>

        {/* Top Performing Agent (only for admins viewing all quotes) */}
        {isAdmin && !activeFilter && topAgent && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Top Performer</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-700">{topAgent[0]}</span>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                ${Number(topAgent[1]).toLocaleString()}
              </Badge>
            </div>
          </div>
        )}

        {/* Filter Status */}
        {activeFilter && (
          <div className="text-center pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              Filtered: {getFilterLabel()}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
