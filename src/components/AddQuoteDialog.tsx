import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { getTodayInTimezone } from "@/utils/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";

interface QuoteItemData {
  id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  cost_override?: number;
  total_price: number;
  item?: any;
}

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: Omit<Quote, "id">) => void;
  clients: Client[];
  clientInfos: ClientInfo[]; 
}

export const AddQuoteDialog = ({ open, onOpenChange, onAddQuote, clients, clientInfos }: AddQuoteDialogProps) => {
  const [clientId, setClientId] = useState("");
  const [clientInfoId, setClientInfoId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteMonth, setQuoteMonth] = useState("");
  const [quoteYear, setQuoteYear] = useState("");
  const [status, setStatus] = useState("pending");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [commissionOverride, setCommissionOverride] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItemData[]>([]);
  const { user } = useAuth();
  
  // Initialize date with today's date in the configured timezone
  useEffect(() => {
    if (!date) {
      setDate(getTodayInTimezone());
    }
  }, []);

  // Generate next quote number when dialog opens
  useEffect(() => {
    const generateNextQuoteNumber = async () => {
      if (open && user) {
        try {
          const { data, error } = await supabase
            .from('quotes')
            .select('quote_number')
            .eq('user_id', user.id)
            .not('quote_number', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error('Error fetching last quote number:', error);
            setQuoteNumber("1");
            return;
          }

          let nextNumber = 1;
          if (data && data.length > 0 && data[0].quote_number) {
            const lastNumber = parseInt(data[0].quote_number);
            if (!isNaN(lastNumber)) {
              nextNumber = lastNumber + 1;
            }
          }
          
          setQuoteNumber(nextNumber.toString());
        } catch (err) {
          console.error('Error generating quote number:', err);
          setQuoteNumber("1");
        }
      }
    };

    generateNextQuoteNumber();
  }, [open, user]);
  
  // Handle client selection - auto-select agent based on client's agent_id
  useEffect(() => {
    if (clientInfoId && clientInfoId !== "none") {
      const selectedClient = clientInfos.find(info => info.id === clientInfoId);
      
      if (selectedClient && selectedClient.agent_id) {
        setClientId(selectedClient.agent_id);
      } else {
        setClientId("");
      }
    } else {
      setClientId("");
    }
  }, [clientInfoId, clientInfos]);

  // Update amount when quote items change
  useEffect(() => {
    const totalAmount = quoteItems.reduce((total, item) => total + item.total_price, 0);
    setAmount(totalAmount.toString());
  }, [quoteItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientId && amount && date) {
      const selectedClient = clients.find(client => client.id === clientId);
      const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? clientInfos.find(info => info.id === clientInfoId) : null;
      
      if (selectedClient) {
        onAddQuote({
          clientId,
          clientName: selectedClient.name,
          companyName: selectedClient.companyName || selectedClient.name,
          amount: parseFloat(amount),
          date,
          description: description || "",
          quoteNumber: quoteNumber || undefined,
          quoteMonth: quoteMonth || undefined,
          quoteYear: quoteYear || undefined,
          status,
          clientInfoId: clientInfoId !== "none" ? clientInfoId : undefined,
          clientCompanyName: selectedClientInfo?.company_name,
          commissionOverride: commissionOverride ? parseFloat(commissionOverride) : undefined,
          expiresAt: expiresAt || undefined,
          notes: notes || undefined,
          quoteItems: quoteItems
        });
        
        // Reset form
        setClientId("");
        setClientInfoId("");
        setAmount("");
        setDate(getTodayInTimezone());
        setDescription("");
        setQuoteNumber("");
        setQuoteMonth("");
        setQuoteYear("");
        setStatus("pending");
        setExpiresAt("");
        setNotes("");
        setCommissionOverride("");
        setQuoteItems([]);
        onOpenChange(false);
      }
    }
  };

  const selectedAgent = clientId ? clients.find(c => c.id === clientId) : null;
  const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? clientInfos.find(info => info.id === clientInfoId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Quote</DialogTitle>
          <DialogDescription>
            Create a new quote for a client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
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
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Agent Display */}
          {selectedAgent && (
            <div className="space-y-2">
              <Label>Associated Agent</Label>
              <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                {selectedAgent.name} {selectedAgent.companyName && `(${selectedAgent.companyName})`}
              </div>
            </div>
          )}

          <QuoteItemsManager 
            items={quoteItems}
            onItemsChange={setQuoteItems}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Calculated from items"
                readOnly
                className="bg-gray-100"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Quote Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quote description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quoteNumber">Quote Number</Label>
              <Input
                id="quoteNumber"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                placeholder="Auto-generated"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissionOverride">Commission Override (%)</Label>
            <Input
              id="commissionOverride"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commissionOverride}
              onChange={(e) => setCommissionOverride(e.target.value)}
              placeholder="Optional commission override"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the quote"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedAgent || clientInfos.length === 0 || quoteItems.length === 0}
            >
              Add Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
