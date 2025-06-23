import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Transaction, Client, ClientInfo } from "@/types/index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicInfoTab } from "@/components/BasicInfoTab";
import { PaymentDetailsTab } from "@/components/PaymentDetailsTab";
import { CommissionDetailsTab } from "@/components/CommissionDetailsTab";

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  clients: Client[];
  clientInfos: ClientInfo[];
}

export const EditTransactionDialog = ({
  transaction,
  open,
  onOpenChange,
  onUpdateTransaction,
  clients,
  clientInfos
}: EditTransactionDialogProps) => {
  const [clientId, setClientId] = useState(transaction?.clientId || "");
  const [clientInfoId, setClientInfoId] = useState(transaction?.clientInfoId || "none");
  const [amount, setAmount] = useState(transaction?.amount.toString() || "");
  const [date, setDate] = useState(transaction?.date || "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [isPaid, setIsPaid] = useState(transaction?.isPaid || false);
  const [paidDate, setPaidDate] = useState(transaction?.paidDate || "");
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || "unpaid");
  const [referenceNumber, setReferenceNumber] = useState(transaction?.referenceNumber || "");
  const [commissionRate, setCommissionRate] = useState(transaction?.commissionRate?.toString() || "");
  const [commissionAmount, setCommissionAmount] = useState(transaction?.commissionAmount?.toString() || "");
  const [isApproved, setIsApproved] = useState(transaction?.isApproved || false);
  const [commissionOverride, setCommissionOverride] = useState(transaction?.commissionOverride?.toString() || "");
  const [invoiceMonth, setInvoiceMonth] = useState(transaction?.invoiceMonth || "");
  const [invoiceYear, setInvoiceYear] = useState(transaction?.invoiceYear || "");
  const [invoiceNumber, setInvoiceNumber] = useState(transaction?.invoiceNumber || "");

  useEffect(() => {
    if (transaction) {
      setClientId(transaction.clientId || "");
      setClientInfoId(transaction.clientInfoId || "none");
      setAmount(transaction.amount.toString() || "");
      setDate(transaction.date || "");
      setDescription(transaction.description || "");
      setIsPaid(transaction.isPaid || false);
      setPaidDate(transaction.paidDate || "");
      setPaymentMethod(transaction.paymentMethod || "unpaid");
      setReferenceNumber(transaction.referenceNumber || "");
      setCommissionRate(transaction.commissionRate?.toString() || "");
      setCommissionAmount(transaction.commissionAmount?.toString() || "");
      setIsApproved(transaction.isApproved || false);
      setCommissionOverride(transaction.commissionOverride?.toString() || "");
      setInvoiceMonth(transaction.invoiceMonth || "");
      setInvoiceYear(transaction.invoiceYear || "");
      setInvoiceNumber(transaction.invoiceNumber || "");
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!transaction) return;

    const updatedTransaction: Transaction = {
      ...transaction,
      clientId,
      clientName: clients.find(client => client.id === clientId)?.name || "No Agent Assigned",
      companyName: clients.find(client => client.id === clientId)?.companyName || undefined,
      amount: parseFloat(amount),
      date,
      description,
      isPaid,
      paidDate,
      paymentMethod,
      referenceNumber,
      commissionRate: parseFloat(commissionRate),
      commissionAmount: parseFloat(commissionAmount),
      isApproved,
      clientInfoId: clientInfoId !== "none" ? clientInfoId : undefined,
      clientCompanyName: clientInfos.find(ci => ci.id === clientInfoId)?.company_name,
      commissionOverride: commissionOverride ? parseFloat(commissionOverride) : undefined,
      invoiceMonth,
      invoiceYear,
      invoiceNumber
    };

    onUpdateTransaction(updatedTransaction);
    onOpenChange(false);
  };

  const filteredClientInfos = clientInfos.filter(clientInfo =>
    clients.some(client => client.companyName === clientInfo.company_name)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Make changes to the transaction details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="payment">Payment Details</TabsTrigger>
              <TabsTrigger value="commission">Commission Details</TabsTrigger>
            </TabsList>
            <TabsContent value="basic">
              <BasicInfoTab
                clientId={clientId}
                setClientId={setClientId}
                clientInfoId={clientInfoId}
                setClientInfoId={setClientInfoId}
                amount={amount}
                setAmount={setAmount}
                date={date}
                setDate={setDate}
                description={description}
                setDescription={setDescription}
                clients={clients}
                clientInfos={clientInfos}
                filteredClientInfos={filteredClientInfos}
              />
            </TabsContent>
            <TabsContent value="payment">
              <PaymentDetailsTab
                isPaid={isPaid}
                setIsPaid={setIsPaid}
                paidDate={paidDate}
                setPaidDate={setPaidDate}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                referenceNumber={referenceNumber}
                setReferenceNumber={setReferenceNumber}
              />
            </TabsContent>
            <TabsContent value="commission">
              <CommissionDetailsTab
                commissionRate={commissionRate}
                setCommissionRate={setCommissionRate}
                commissionAmount={commissionAmount}
                setCommissionAmount={setCommissionAmount}
                isApproved={isApproved}
                setIsApproved={setIsApproved}
                commissionOverride={commissionOverride}
                setCommissionOverride={setCommissionOverride}
                invoiceMonth={invoiceMonth}
                setInvoiceMonth={setInvoiceMonth}
                invoiceYear={invoiceYear}
                setInvoiceYear={setInvoiceYear}
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
              />
            </TabsContent>
          </Tabs>
          <div className="flex justify-end">
            <Button type="submit">Update Transaction</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
