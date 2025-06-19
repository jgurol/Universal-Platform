
import { Card, CardContent } from "@/components/ui/card";
import { Building, Search, Clock, CheckCircle, Zap } from "lucide-react";
import { CircuitQuote } from "@/hooks/useCircuitQuotes";

interface CircuitQuotesStatsProps {
  quotes: CircuitQuote[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export const CircuitQuotesStats = ({ quotes, activeFilter, onFilterChange }: CircuitQuotesStatsProps) => {
  const stats = [
    {
      icon: Building,
      label: "Total Quotes",
      value: quotes.length,
      color: "text-purple-600",
      filter: null
    },
    {
      icon: Search,
      label: "New Pricing",
      value: quotes.filter(q => q.status === 'new_pricing').length,
      color: "text-blue-600",
      filter: "new_pricing"
    },
    {
      icon: Clock,
      label: "Researching",
      value: quotes.filter(q => q.status === 'researching').length,
      color: "text-yellow-600",
      filter: "researching"
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: quotes.filter(q => q.status === 'completed').length,
      color: "text-green-600",
      filter: "completed"
    },
    {
      icon: Zap,
      label: "Sent to Customer",
      value: quotes.filter(q => q.status === 'sent_to_customer').length,
      color: "text-orange-600",
      filter: "sent_to_customer"
    }
  ];

  const handleFilterClick = (filter: string | null) => {
    if (activeFilter === filter) {
      onFilterChange(null);
    } else {
      onFilterChange(filter);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
            activeFilter === stat.filter ? 'ring-2 ring-blue-500 shadow-lg' : ''
          }`}
          onClick={() => handleFilterClick(stat.filter)}
        >
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <stat.icon className={`h-8 w-8 ${stat.color} ${
                activeFilter === stat.filter ? 'opacity-100' : 'opacity-80'
              }`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${
                  activeFilter === stat.filter ? stat.color : 'text-gray-900'
                }`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
