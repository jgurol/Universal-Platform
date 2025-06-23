
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Quote } from "@/types/index";

interface CommissionChartProps {
  quotes: Quote[];
}

export const CommissionChart = ({ quotes }: CommissionChartProps) => {
  // Handle undefined quotes prop
  const safeQuotes = quotes || [];
  
  // Get unique agents and assign colors
  const uniqueAgents = Array.from(new Set(safeQuotes.map(q => q.clientName)));
  const colors = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
    "#ec4899", // Pink
    "#6b7280"  // Gray
  ];

  // Group quotes by month and agent
  const monthlyData = safeQuotes.reduce((acc, quote) => {
    const date = new Date(quote.date);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const agentName = quote.clientName;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey };
      // Initialize all agents with 0
      uniqueAgents.forEach(agent => {
        acc[monthKey][agent] = 0;
      });
    }
    
    if (!acc[monthKey][agentName]) {
      acc[monthKey][agentName] = 0;
    }
    
    acc[monthKey][agentName] += quote.commission || 0;
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(monthlyData).sort((a: any, b: any) => 
    new Date(a.month + " 1").getTime() - new Date(b.month + " 1").getTime()
  );

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Commission Trends by Agent</CardTitle>
        <CardDescription>Monthly commission earnings overview per agent</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
                labelStyle={{ color: '#333' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              {uniqueAgents.map((agent, index) => (
                <Bar 
                  key={agent}
                  dataKey={agent} 
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
