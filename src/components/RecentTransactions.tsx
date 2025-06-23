
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Transaction, Client, ClientInfo } from "@/pages/Index";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { TransactionHeader } from "@/components/TransactionHeader";
import { TransactionTable } from "@/components/TransactionTable";
import { TransactionEmptyState } from "@/components/TransactionEmptyState";
import { ApprovalWarningDialog } from "@/components/ApprovalWarningDialog";
import { useAuth } from "@/context/AuthContext";

interface RecentTransactionsProps {
  transactions: Transaction[];
  clients: Client[];
  clientInfos: ClientInfo[];
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onApproveCommission: (transactionId: string) => void;
  onPayCommission?: (transactionId: string, paymentData: {
    paidDate: string;
    paymentMethod: string;
    referenceNumber: string;
  }) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  associatedAgentId?: string | null;
}

export const RecentTransactions = ({ 
  transactions, 
  clients, 
  clientInfos,
  onAddTransaction, 
  onUpdateTransaction,
  onApproveCommission,
  onPayCommission,
  onDeleteTransaction,
  associatedAgentId
}: RecentTransactionsProps) => {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [approvalWarningOpen, setApprovalWarningOpen] = useState(false);
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  // Function to determine if a transaction is from the current month
  const isCurrentMonth = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  // Function to handle editing a transaction - only for admins
  const handleEditClick = (transaction: Transaction) => {
    if (!isAdmin) return;
    setCurrentTransaction(transaction);
    setIsEditTransactionOpen(true);
  };

  // Function to handle commission approval with invoice payment check
  const handleApproveCommission = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    
    // Only allow approval if the invoice has been paid
    if (transaction && transaction.isPaid) {
      onApproveCommission(transactionId);
    }
  };

  // Function to handle commission payment
  const handlePayCommission = (transactionId: string, paymentData: {
    paidDate: string;
    paymentMethod: string;
    referenceNumber: string;
  }) => {
    const transaction = transactions.find(t => t.id === transactionId);
    
    // Only allow payment if the invoice has been paid
    if (transaction && transaction.isPaid && onPayCommission) {
      onPayCommission(transactionId, paymentData);
    }
  };

  return (
    <>
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <TransactionHeader
            transactionCount={transactions.length}
            onAddTransaction={() => setIsAddTransactionOpen(true)}
          />
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-6">
              <TransactionEmptyState associatedAgentId={associatedAgentId} />
            </div>
          ) : (
            <TransactionTable
              transactions={transactions}
              clientInfos={clientInfos}
              onEditClick={isAdmin ? handleEditClick : undefined}
              onApproveCommission={handleApproveCommission}
              onPayCommission={onPayCommission ? handlePayCommission : undefined}
              onDeleteTransaction={onDeleteTransaction}
              isCurrentMonth={isCurrentMonth}
            />
          )}
        </CardContent>
      </Card>

      <ApprovalWarningDialog
        open={approvalWarningOpen}
        onOpenChange={setApprovalWarningOpen}
        onConfirm={() => {}}
        onCancel={() => {}}
      />

      {isAdmin && (
        <>
          <AddTransactionDialog
            open={isAddTransactionOpen}
            onOpenChange={setIsAddTransactionOpen}
            onAddTransaction={onAddTransaction}
            clients={clients}
            clientInfos={clientInfos}
          />

          <EditTransactionDialog
            transaction={currentTransaction}
            open={isEditTransactionOpen}
            onOpenChange={setIsEditTransactionOpen}
            onUpdateTransaction={onUpdateTransaction}
            clients={clients}
            clientInfos={clientInfos}
          />
        </>
      )}
    </>
  );
};
