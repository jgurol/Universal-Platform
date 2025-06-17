
import { Card, CardContent } from "@/components/ui/card";
import { Building, Search, Clock, CheckCircle, Zap } from "lucide-react";
import { CircuitQuote } from "@/hooks/useCircuitQuotes";

interface CircuitQuotesStatsProps {
  quotes: CircuitQuote[];
}

export const CircuitQuotesStats = ({ quotes }: CircuitQuotesStatsProps) => {
  const stats = [
    {
      icon: Building,
      label: "Total Quotes",
      value: quotes.length,
      color: "text-purple-600"
    },
    {
      icon: Search,
      label: "New Pricing",
      value: quotes.filter(q => q.status === 'new_pricing').length,
      color: "text-blue-600"
    },
    {
      icon: Clock,
      label: "Researching",
      value: quotes.filter(q => q.status === 'researching').length,
      color: "text-yellow-600"
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: quotes.filter(q => q.status === 'completed').length,
      color: "text-green-600"
    },
    {
      icon: Zap,
      label: "Sent to Customer",
      value: quotes.filter(q => q.status === 'sent_to_customer').length,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
