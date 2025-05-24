
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Transaction, Client } from "@/pages/Index";

export const useTransactionActions = (
  clients: Client[],
  fetchTransactions: () => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper function to calculate commission using override hierarchy
  const calculateCommission = async (
    amount: number,
    clientId: string,
    clientInfoId?: string,
    transactionOverride?: number
  ): Promise<number> => {
    // 1. Transaction override takes highest precedence
    if (transactionOverride !== undefined && transactionOverride !== null) {
      return (transactionOverride / 100) * amount;
    }

    // 2. Client override takes second precedence
    if (clientInfoId) {
      const { data: clientInfo } = await supabase
        .from('client_info')
        .select('commission_override')
        .eq('id', clientInfoId)
        .single();

      if (clientInfo?.commission_override !== null && clientInfo?.commission_override !== undefined) {
        return (clientInfo.commission_override / 100) * amount;
      }
    }

    // 3. Agent commission rate is the default
    const client = clients.find(c => c.id === clientId);
    if (client) {
      return (client.commissionRate / 100) * amount;
    }

    return 0;
  };

  // Function to add a new transaction (stored as quote) to Supabase
  const addTransaction = async (newTransaction: Omit<Transaction, "id">) => {
    if (!user) return;
    
    try {
      // Calculate commission using override hierarchy
      const commission = await calculateCommission(
        newTransaction.amount,
        newTransaction.clientId,
        newTransaction.clientInfoId,
        newTransaction.commissionOverride
      );

      const { data, error } = await supabase
        .from('quotes')
        .insert({
          client_id: newTransaction.clientId,
          client_info_id: newTransaction.clientInfoId === "none" ? null : newTransaction.clientInfoId,
          amount: newTransaction.amount,
          date: newTransaction.date,
          description: newTransaction.description,
          quote_number: newTransaction.invoiceNumber,
          quote_month: newTransaction.invoiceMonth,
          quote_year: newTransaction.invoiceYear,
          status: newTransaction.isPaid ? 'approved' : 'pending',
          commission: commission,
          commission_override: newTransaction.commissionOverride || null,
          expires_at: null, // Transactions don't have expiration
          notes: `Payment Method: ${newTransaction.paymentMethod || 'unpaid'}, Reference: ${newTransaction.referenceNumber || 'N/A'}`,
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        toast({
          title: "Failed to add transaction",
          description: error.message,
          variant: "destructive"
        });
      } else if (data) {
        // Refresh transactions to get the new one
        fetchTransactions();
        
        const client = clients.find(c => c.id === newTransaction.clientId);
        toast({
          title: "Transaction added",
          description: `Transaction for ${client?.name} has been added successfully.`,
        });
      }
    } catch (err) {
      console.error('Error in add transaction operation:', err);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
    }
  };

  // Function to update a transaction in Supabase
  const updateTransaction = async (updatedTransaction: Transaction) => {
    if (!user) return;
    
    try {
      // Calculate commission using override hierarchy
      const commission = await calculateCommission(
        updatedTransaction.amount,
        updatedTransaction.clientId,
        updatedTransaction.clientInfoId,
        updatedTransaction.commissionOverride
      );

      const { data, error } = await supabase
        .from('quotes')
        .update({
          client_id: updatedTransaction.clientId,
          client_info_id: updatedTransaction.clientInfoId === "none" ? null : updatedTransaction.clientInfoId,
          amount: updatedTransaction.amount,
          date: updatedTransaction.date,
          description: updatedTransaction.description,
          quote_number: updatedTransaction.invoiceNumber,
          quote_month: updatedTransaction.invoiceMonth,
          quote_year: updatedTransaction.invoiceYear,
          status: updatedTransaction.isPaid ? 'approved' : 'pending',
          commission: commission,
          commission_override: updatedTransaction.commissionOverride || null,
          notes: `Payment Method: ${updatedTransaction.paymentMethod || 'unpaid'}, Reference: ${updatedTransaction.referenceNumber || 'N/A'}`
        })
        .eq('id', updatedTransaction.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        toast({
          title: "Failed to update transaction",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Refresh transactions to get the updated one
        fetchTransactions();
        
        const client = clients.find(c => c.id === updatedTransaction.clientId);
        toast({
          title: "Transaction updated",
          description: `Transaction for ${client?.name} has been updated successfully.`,
        });
      }
    } catch (err) {
      console.error('Error in update transaction operation:', err);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive"
      });
    }
  };

  // Function to approve commission
  const approveCommission = async (transactionId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'approved'
        })
        .eq('id', transactionId);

      if (error) {
        console.error('Error approving commission:', error);
        toast({
          title: "Failed to approve commission",
          description: error.message,
          variant: "destructive"
        });
      } else {
        fetchTransactions();
        toast({
          title: "Commission approved",
          description: "Commission has been approved successfully.",
        });
      }
    } catch (err) {
      console.error('Error in approve commission operation:', err);
      toast({
        title: "Error",
        description: "Failed to approve commission",
        variant: "destructive"
      });
    }
  };

  // Function to pay commission
  const payCommission = async (transactionId: string, paymentData: {
    paidDate: string;
    paymentMethod: string;
    referenceNumber: string;
  }) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          notes: `Payment Method: ${paymentData.paymentMethod}, Reference: ${paymentData.referenceNumber}, Paid: ${paymentData.paidDate}`
        })
        .eq('id', transactionId);

      if (error) {
        console.error('Error paying commission:', error);
        toast({
          title: "Failed to pay commission",
          description: error.message,
          variant: "destructive"
        });
      } else {
        fetchTransactions();
        toast({
          title: "Commission paid",
          description: "Commission has been marked as paid successfully.",
        });
      }
    } catch (err) {
      console.error('Error in pay commission operation:', err);
      toast({
        title: "Error",
        description: "Failed to pay commission",
        variant: "destructive"
      });
    }
  };

  // Function to delete a transaction
  const deleteTransaction = async (transactionId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.rpc('delete_quote', {
        quote_id: transactionId
      });

      if (error) {
        console.error('[deleteTransaction] Error deleting transaction:', error);
        toast({
          title: "Failed to delete transaction",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Refresh transactions to reflect the deletion
        fetchTransactions();
        toast({
          title: "Transaction deleted",
          description: "The transaction has been deleted successfully.",
        });
      }
    } catch (err) {
      console.error('[deleteTransaction] Error in delete transaction operation:', err);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      });
    }
  };

  return {
    addTransaction,
    updateTransaction,
    approveCommission,
    payCommission,
    deleteTransaction
  };
};
