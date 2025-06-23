import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Transaction, Client, ClientInfo } from "@/types/index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicInfoTab } from "@/components/BasicInfoTab";
import { PaymentDetailsTab } from "@/components/PaymentDetailsTab";
import { CommissionDetailsTab } from "@/components/CommissionDetailsTab";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
  clients: Client[];
  clientInfos: ClientInfo[];
}

export const AddTransactionDialog = ({
  open,
  onOpenChange,
  onAddTransaction,
  clients,
  clientInfos
}: AddTransactionDialogProps) => {
  const [clientId, setClientId] = useState("");
  const [clientInfoId, setClientInfoId] = useState("none");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [paidDate, setPaidDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [commissionPaidDate, setCommissionPaidDate] = useState("");
  const [invoiceMonth, setInvoiceMonth] = useState("");
  const [invoiceYear, setInvoiceYear] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  // Filter clientInfos based on selected client
  const filteredClientInfos = clients.length > 0 && clientId
    ? clientInfos.filter(clientInfo => clientInfo.agent_id === clientId)
    : clientInfos;

  // Reset form when dialog is opened or closed
  useEffect(() => {
    if (!open) {
      setClientId("");
      setClientInfoId("none");
      setAmount("");
      setDate("");
      setDescription("");
      setIsPaid(false);
      setPaidDate("");
      setPaymentMethod("");
      setReferenceNumber("");
      setCommissionRate("");
      setCommissionAmount("");
      setIsApproved(false);
      setCommissionPaidDate("");
      setInvoiceMonth("");
      setInvoiceYear("");
      setInvoiceNumber("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!amount || !date) {
      alert("Please fill in all required fields.");
      return;
    }

    // Create new transaction object
    const newTransaction: Omit<Transaction, "id"> = {
      clientId,
      clientName: clients.find(client => client.id === clientId)?.name || "Unknown Agent",
      companyName: clients.find(client => client.id === clientId)?.companyName || "Unknown Company",
      amount: parseFloat(amount),
      date,
      description,
      commissionRate: commissionRate ? parseFloat(commissionRate) : undefined,
      commissionAmount: commissionAmount ? parseFloat(commissionAmount) : undefined,
      isPaid,
      paidDate,
      paymentMethod,
      referenceNumber,
      isApproved,
      commissionPaidDate,
      clientInfoId: clientInfoId !== "none" ? clientInfoId : undefined,
      clientCompanyName: clientInfos.find(clientInfo => clientInfo.id === clientInfoId)?.company_name,
      commission: commissionAmount ? parseFloat(commissionAmount) : undefined,
      invoiceMonth,
      invoiceYear,
      invoiceNumber
    };

    onAddTransaction(newTransaction);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Create a new transaction record.
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
                invoiceMonth={invoiceMonth}
                setInvoiceMonth={setInvoiceMonth}
                invoiceYear={invoiceYear}
                setInvoiceYear={setInvoiceYear}
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
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
                commissionPaidDate={commissionPaidDate}
                setCommissionPaidDate={setCommissionPaidDate}
              />
            </TabsContent>
          </Tabs>
          <div className="flex justify-end">
            <Button type="submit">Add Transaction</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
