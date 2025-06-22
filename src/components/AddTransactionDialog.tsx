import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transaction, Client, ClientInfo } from "@/pages/Index";
import { BasicInfoTab } from "./BasicInfoTab";
import { InvoiceDetailsTab } from "./InvoiceDetailsTab";
import { PaymentTab } from "./PaymentTab";
import { getTodayInTimezone } from "@/utils/dateUtils";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
  clients: Client[];
  clientInfos: ClientInfo[]; 
}

export const AddTransactionDialog = ({ open, onOpenChange, onAddTransaction, clients, clientInfos }: AddTransactionDialogProps) => {
  const [clientId, setClientId] = useState("");
  const [clientInfoId, setClientInfoId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [datePaid, setDatePaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("unpaid");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [invoiceMonth, setInvoiceMonth] = useState("");
  const [invoiceYear, setInvoiceYear] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [commissionPaidDate, setCommissionPaidDate] = useState("");
  const [commissionOverride, setCommissionOverride] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  
  // Initialize date with today's date in the configured timezone
  useEffect(() => {
    if (!date) {
      setDate(getTodayInTimezone());
    }
  }, []);
  
  // Debug logging
  console.log("[AddTransactionDialog] Available agents:", clients);
  console.log("[AddTransactionDialog] Available clients:", clientInfos);
  
  // Filter client infos based on selected agent
  const [filteredClientInfos, setFilteredClientInfos] = useState<ClientInfo[]>(clientInfos);

  // Handle client selection - auto-select agent based on client's agent_id
  useEffect(() => {
    if (clientInfoId && clientInfoId !== "none") {
      const selectedClient = clientInfos.find(info => info.id === clientInfoId);
      console.log("[AddTransactionDialog] Selected client:", selectedClient);
      
      if (selectedClient && selectedClient.agent_id) {
        console.log("[AddTransactionDialog] Auto-selecting agent:", selectedClient.agent_id);
        setClientId(selectedClient.agent_id);
      } else {
        console.log("[AddTransactionDialog] No agent associated with this client");
        setClientId("");
      }
    } else {
      console.log("[AddTransactionDialog] No client selected, clearing agent");
      setClientId("");
    }
  }, [clientInfoId, clientInfos]);

  // Update filtered client infos when agent changes
  useEffect(() => {
    if (clientId) {
      setFilteredClientInfos(clientInfos.filter(info => !info.agent_id || info.agent_id === clientId));
    } else {
      setFilteredClientInfos(clientInfos);
    }
  }, [clientId, clientInfos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientId && amount && date) {
      const selectedClient = clients.find(client => client.id === clientId);
      const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? clientInfos.find(info => info.id === clientInfoId) : null;
      
      console.log("[AddTransactionDialog] Submitting transaction:");
      console.log("- Agent:", selectedClient);
      console.log("- Client:", selectedClientInfo);
      
      if (selectedClient) {
        onAddTransaction({
          clientId,
          clientName: selectedClient.name,
          companyName: selectedClient.companyName || selectedClient.name,
          amount: parseFloat(amount),
          date,
          description: description || "",
          datePaid: isPaid ? datePaid || undefined : undefined,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          invoiceMonth: invoiceMonth || undefined,
          invoiceYear: invoiceYear || undefined,
          invoiceNumber: invoiceNumber || undefined,
          isPaid,
          clientInfoId: clientInfoId !== "none" ? clientInfoId : undefined,
          clientCompanyName: selectedClientInfo?.company_name,
          commissionPaidDate: commissionPaidDate || undefined,
          commissionOverride: commissionOverride ? parseFloat(commissionOverride) : undefined,
          isApproved
        });
        
        // Reset form
        setClientId("");
        setClientInfoId("");
        setAmount("");
        setDate(getTodayInTimezone());
        setDescription("");
        setDatePaid("");
        setPaymentMethod("unpaid");
        setReferenceNumber("");
        setInvoiceMonth("");
        setInvoiceYear("");
        setInvoiceNumber("");
        setIsPaid(false);
        setCommissionPaidDate("");
        setCommissionOverride("");
        setIsApproved(false);
        onOpenChange(false);
      }
    }
  };

  const selectedAgent = clientId ? clients.find(c => c.id === clientId) : null;
  const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? clientInfos.find(info => info.id === clientInfoId) : null;

  // Calculate effective commission rate for display
  const getEffectiveCommissionRate = () => {
    if (commissionOverride) return parseFloat(commissionOverride);
    if (selectedClientInfo?.commission_override) return selectedClientInfo.commission_override;
    if (selectedAgent) return selectedAgent.commissionRate;
    return null;
  };

  const effectiveRate = getEffectiveCommissionRate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a new commission payment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="invoice">Invoice Details</TabsTrigger>
              <TabsTrigger value="payment">Commission</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <div className="space-y-4">
                {/* Client Selection - Primary selection */}
                <div className="space-y-2">
                  <Label htmlFor="clientInfo">Client Company (Required)</Label>
                  <Select value={clientInfoId} onValueChange={setClientInfoId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client company" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientInfos.length === 0 ? (
                        <SelectItem value="no-clients" disabled>
                          No clients available - Add clients first
                        </SelectItem>
                      ) : (
                        clientInfos.map((clientInfo) => (
                          <SelectItem key={clientInfo.id} value={clientInfo.id}>
                            {clientInfo.company_name}
                            {clientInfo.commission_override && (
                              <span className="text-xs text-blue-600 ml-2">
                                ({clientInfo.commission_override}% override)
                              </span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {clientInfoId && clientInfoId !== "none" && (
                    <div className="text-xs text-gray-500">
                      Company: {clientInfos.find(ci => ci.id === clientInfoId)?.company_name || "N/A"}
                    </div>
                  )}
                </div>

                {/* Agent Display - Shows auto-selected agent */}
                {selectedAgent && (
                  <div className="space-y-2">
                    <Label>Associated Agent</Label>
                    <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                      {selectedAgent.name} {selectedAgent.companyName && `(${selectedAgent.companyName})`}
                      <div className="text-xs text-blue-600">
                        Agent Rate: {selectedAgent.commissionRate}%
                      </div>
                    </div>
                    <div className="text-xs text-green-600">
                      ✓ Agent automatically selected based on client
                    </div>
                  </div>
                )}

                {/* Commission Override */}
                <div className="space-y-2">
                  <Label htmlFor="commissionOverride">Transaction Commission Override (%)</Label>
                  <Input
                    id="commissionOverride"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={commissionOverride}
                    onChange={(e) => setCommissionOverride(e.target.value)}
                    placeholder="Enter commission rate override (optional)"
                  />
                  <div className="text-xs text-gray-500">
                    Optional. This will override both client and agent commission rates for this transaction.
                    {effectiveRate && (
                      <div className="mt-1 font-medium text-blue-600">
                        Effective rate: {effectiveRate}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning if no agent is associated */}
                {clientInfoId && clientInfoId !== "none" && !selectedAgent && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="text-sm text-yellow-800">
                      ⚠️ This client is not associated with any agent. Please associate this client with an agent first.
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Transaction Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter transaction description"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="invoice">
              <InvoiceDetailsTab
                invoiceMonth={invoiceMonth}
                setInvoiceMonth={setInvoiceMonth}
                invoiceYear={invoiceYear}
                setInvoiceYear={setInvoiceYear}
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
                isPaid={isPaid}
                setIsPaid={setIsPaid}
                datePaid={datePaid}
                setDatePaid={setDatePaid}
              />
            </TabsContent>
            
            <TabsContent value="payment">
              <PaymentTab
                isPaid={isPaid}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                referenceNumber={referenceNumber}
                setReferenceNumber={setReferenceNumber}
                commissionPaidDate={commissionPaidDate}
                setCommissionPaidDate={setCommissionPaidDate}
                isApproved={isApproved}
                setIsApproved={setIsApproved}
              />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedAgent || clientInfos.length === 0}
            >
              Add Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
