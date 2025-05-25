
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { QuoteDetailsSection } from "@/components/QuoteDetailsSection";
import { useQuoteForm } from "@/hooks/useQuoteForm";
import { useQuoteItems } from "@/hooks/useQuoteItems";
import { updateQuoteItems, calculateTotalsByChargeType } from "@/services/quoteItemsService";

interface EditQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateQuote: (quote: Quote) => void;
  clients: Client[];
  clientInfos: ClientInfo[];
}

export const EditQuoteDialog = ({ 
  quote, 
  open, 
  onOpenChange, 
  onUpdateQuote, 
  clients, 
  clientInfos 
}: EditQuoteDialogProps) => {
  const {
    clientId,
    setClientId,
    clientInfoId,
    setClientInfoId,
    date,
    setDate,
    description,
    setDescription,
    quoteNumber,
    setQuoteNumber,
    status,
    setStatus,
    expiresAt,
    setExpiresAt,
    notes,
    setNotes,
    commissionOverride,
    setCommissionOverride
  } = useQuoteForm(quote, open);

  const { quoteItems, setQuoteItems } = useQuoteItems(quote, open);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quote && clientId && date) {
      const selectedClient = clients.find(client => client.id === clientId);
      const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? clientInfos.find(info => info.id === clientInfoId) : null;
      
      if (selectedClient) {
        const { totalAmount } = calculateTotalsByChargeType(quoteItems);
        
        // Update quote items in database
        await updateQuoteItems(quote.id, quoteItems);

        onUpdateQuote({
          ...quote,
          clientId,
          clientName: selectedClient.name,
          companyName: selectedClient.companyName || selectedClient.name,
          amount: totalAmount,
          date,
          description: description || "",
          quoteNumber: quoteNumber || undefined,
          status,
          clientInfoId: clientInfoId !== "none" ? clientInfoId : undefined,
          clientCompanyName: selectedClientInfo?.company_name,
          commissionOverride: commissionOverride ? parseFloat(commissionOverride) : undefined,
          expiresAt: expiresAt || undefined,
          notes: notes || undefined
        });
        
        onOpenChange(false);
      }
    }
  };

  const selectedSalesperson = clientId ? clients.find(c => c.id === clientId) : null;

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Edit Quote</DialogTitle>
              <DialogDescription>
                Update the quote details and items. A new version number will be assigned.
              </DialogDescription>
            </div>
            
            <QuoteDetailsSection
              quoteNumber={quoteNumber}
              onQuoteNumberChange={setQuoteNumber}
              date={date}
              onDateChange={setDate}
              expiresAt={expiresAt}
              onExpiresAtChange={setExpiresAt}
            />
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quote Name */}
          <div className="space-y-2">
            <Label htmlFor="description">Quote Name</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quote name"
            />
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="clientInfo">Client Company</Label>
            <Select value={clientInfoId} onValueChange={setClientInfoId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client selected</SelectItem>
                {clientInfos.map((clientInfo) => (
                  <SelectItem key={clientInfo.id} value={clientInfo.id}>
                    {clientInfo.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Salesperson Display */}
          {selectedSalesperson && (
            <div className="space-y-2">
              <Label>Associated Salesperson</Label>
              <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                {selectedSalesperson.name} {selectedSalesperson.companyName && `(${selectedSalesperson.companyName})`}
              </div>
            </div>
          )}

          <QuoteItemsManager
            items={quoteItems}
            onItemsChange={setQuoteItems}
            clientInfoId={clientInfoId !== "none" ? clientInfoId : undefined}
          />

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
            >
              Update Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
