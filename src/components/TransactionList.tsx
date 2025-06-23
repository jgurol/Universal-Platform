
import { Transaction, ClientInfo } from "@/types/index";
import { TransactionTable } from "@/components/TransactionTable";

interface TransactionListProps {
  transactions: Transaction[];
  clientInfos: ClientInfo[];
  onEditClick: (transaction: Transaction) => void;
  onApproveCommission: (transactionId: string) => void;
  onPayCommission?: (transactionId: string) => void;
  isCurrentMonth: (dateStr: string) => boolean;
}

export const TransactionList = ({
  transactions,
  clientInfos,
  onEditClick,
  onApproveCommission,
  onPayCommission,
  isCurrentMonth
}: TransactionListProps) => {
  return (
    <TransactionTable
      transactions={transactions}
      clientInfos={clientInfos}
      onEditClick={onEditClick}
      onApproveCommission={onApproveCommission}
      onPayCommission={onPayCommission}
      isCurrentMonth={isCurrentMonth}
    />
  );
};
