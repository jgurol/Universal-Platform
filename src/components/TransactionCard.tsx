
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Building, FileText, Users, Pencil, DollarSign, Trash2 } from "lucide-react";
import { Transaction, ClientInfo } from "@/types/index";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { PayCommissionDialog } from "./PayCommissionDialog";
import { formatDateForDisplay } from "@/utils/dateUtils";

interface TransactionCardProps {
  transaction: Transaction;
  clientInfos: ClientInfo[];
  onEditClick?: (transaction: Transaction) => void;
  onApproveCommission: (transactionId: string) => void;
  onPayCommission?: (transactionId: string, paymentData: {
    paidDate: string;
    paymentMethod: string;
    referenceNumber: string;
  }) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  isCurrentMonth: (dateStr: string) => boolean;
}

// Array for month names - needed for display
const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const TransactionCard = ({
  transaction,
  clientInfos,
  onEditClick,
  onApproveCommission,
  onPayCommission,
  onDeleteTransaction,
  isCurrentMonth
}: TransactionCardProps) => {
  const { isAdmin } = useAuth();
  const [payDialogOpen, setPayDialogOpen] = useState(false);

  const handlePayCommission = () => {
    setPayDialogOpen(true);
  };

  const handleConfirmPayment = (paymentData: {
    paidDate: string;
    paymentMethod: string;
    referenceNumber: string;
  }) => {
    if (onPayCommission) {
      onPayCommission(transaction.id, paymentData);
    }
  };

  const handleDeleteTransaction = () => {
    if (onDeleteTransaction) {
      onDeleteTransaction(transaction.id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{transaction.clientName}</h4>
            <Badge variant="outline" className="text-xs">
              ${transaction.amount.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200 font-mono">
              ID: {transaction.id.slice(0, 8)}...
            </Badge>
            {transaction.isPaid ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Paid
              </Badge>
            ) : (
              isCurrentMonth(transaction.date) && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Due
                </Badge>
              )
            )}
            {transaction.paymentMethod && transaction.isPaid && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {transaction.paymentMethod === "check" ? "Check" : "Zelle"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mb-1 text-sm text-gray-600">
            <Building className="w-4 h-4" />
            {transaction.companyName}
          </div>
          {/* Display client company if available */}
          {transaction.clientInfoId && transaction.clientInfoId !== "none" && (
            <div className="flex items-center gap-1 mb-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              Client: {transaction.clientCompanyName || clientInfos.find(ci => ci.id === transaction.clientInfoId)?.company_name || "N/A"}
            </div>
          )}
          <div className="text-sm text-gray-600 flex items-center gap-1">
            {transaction.invoiceNumber && (
              <>
                <FileText className="w-3 h-3" />
                <span>Invoice #{transaction.invoiceNumber}</span>
                {transaction.invoiceMonth && transaction.invoiceYear && (
                  <span className="text-gray-500">
                    ({months.find(m => m.value === transaction.invoiceMonth)?.label} {transaction.invoiceYear})
                  </span>
                )}
              </>
            )}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {transaction.description}
          </div>
          
          <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
            <span>Date: {formatDateForDisplay(transaction.date)}</span>
            {transaction.datePaid && (
              <span>Paid: {formatDateForDisplay(transaction.datePaid)}</span>
            )}
            {transaction.referenceNumber && transaction.isPaid && (
              <span>
                {transaction.paymentMethod === "check" ? "Check #: " : "Ref #: "}
                {transaction.referenceNumber}
              </span>
            )}
          </div>
          
          {/* Commission section with updated styling based on approval and payment status */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <div className={`font-medium ${transaction.commissionPaidDate ? 'text-green-600' : transaction.isApproved ? 'text-amber-600' : 'text-gray-500'}`}>
              Commission: ${transaction.commission?.toFixed(2) || '0.00'}
              {transaction.commissionPaidDate && (
                <span className="text-xs ml-2">
                  Paid: {formatDateForDisplay(transaction.commissionPaidDate)}
                </span>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                {!transaction.isApproved && transaction.isPaid && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => onApproveCommission(transaction.id)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                  </Button>
                )}
                {!transaction.isApproved && !transaction.isPaid && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 border-gray-200 text-gray-400 cursor-not-allowed"
                    disabled
                    title="Invoice must be paid before approving commission"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                  </Button>
                )}
                {transaction.isApproved && !transaction.commissionPaidDate && transaction.isPaid && onPayCommission && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={handlePayCommission}
                  >
                    <DollarSign className="w-3 h-3 mr-1" /> Mark Paid
                  </Button>
                )}
                {transaction.isApproved && !transaction.commissionPaidDate && !transaction.isPaid && onPayCommission && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 border-gray-200 text-gray-400 cursor-not-allowed"
                    disabled
                    title="Invoice must be paid before paying commission"
                  >
                    <DollarSign className="w-3 h-3 mr-1" /> Mark Paid
                  </Button>
                )}
                {onDeleteTransaction && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleDeleteTransaction}
                  >
                    <Trash2 className="w-3 h-3 mr-1 text-red-600" /> Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {isAdmin && onEditClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-blue-600"
            onClick={() => onEditClick(transaction)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>

      <PayCommissionDialog
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        onPayCommission={handleConfirmPayment}
        transactionId={transaction.id}
      />
    </>
  );
};
