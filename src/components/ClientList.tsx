import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Users, DollarSign } from "lucide-react";
import { Client, Transaction } from "@/types/index";
import { formatDateForDisplay } from "@/utils/dateUtils";

interface ClientListProps {
  clients: Client[];
  transactions: Transaction[];
  onEditClick: (client: Client) => void;
  onDeleteClick: (clientId: string) => void;
}

export const ClientList = ({
  clients,
  transactions,
  onEditClick,
  onDeleteClick
}: ClientListProps) => {
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  const toggleClient = (clientId: string) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  return (
    <div className="space-y-4">
      {clients.map((client) => {
        const clientTransactions = transactions.filter(t => t.clientId === client.id);
        const totalClientEarnings = clientTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

        return (
          <Card key={client.id} className="bg-white shadow-md border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleClient(client.id)}
                >
                  <Users className="w-4 h-4 mr-2" />
                </Button>
                <CardTitle className="text-sm font-medium text-gray-900">{client.name}</CardTitle>
              </div>
              <div className="space-x-2">
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="w-3 h-3 mr-1" />
                  ${totalClientEarnings.toLocaleString()}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditClick(client)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteClick(client.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </CardHeader>
            {expandedClientId === client.id && (
              <CardContent className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Client Details</h5>
                    <div className="text-xs text-gray-500">
                      <p>Email: {client.email}</p>
                      <p>Company: {client.companyName || 'N/A'}</p>
                      <p>Commission Rate: {client.commissionRate}%</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Recent Activity</h5>
                    {clientTransactions.length > 0 ? (
                      <ul className="space-y-2">
                        {clientTransactions.slice(0, 3).map(transaction => (
                          <li key={transaction.id} className="text-xs text-gray-500">
                            {transaction.description || 'Transaction'} - ${transaction.amount.toLocaleString()} on {formatDateForDisplay(transaction.date)}
                          </li>
                        ))}
                        {clientTransactions.length > 3 && (
                          <li className="text-xs text-gray-500">
                            + {clientTransactions.length - 3} more transactions
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No recent transactions.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
