
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { QuoteItemsManager } from "@/components/QuoteItemsManager";
import { QuoteItemData } from "@/types/quoteItems";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

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
  const [clientId, setClientId] = useState("");
  const [clientInfoId, setClientInfoId] = useState("");
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

  // Generate next version number when quote changes
  useEffect(() => {
    const generateNextVersionNumber = async () => {
      if (quote && user && open) {
        try {
          // Get the base quote number (without decimal version)
          const baseQuoteNumber = quote.quoteNumber?.split('.')[0];
          
          if (!baseQuoteNumber) return;
          
          // Find the highest version number for this base quote number
          const { data, error } = await supabase
            .from('quotes')
            .select('quote_number')
            .eq('user_id', user.id)
            .not('quote_number', 'is', null)
            .like('quote_number', `${baseQuoteNumber}.%`)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching quote versions:', error);
            setQuoteNumber(`${baseQuoteNumber}.1`);
            return;
          }

          let nextVersion = 1;
          if (data && data.length > 0) {
            // Find the highest version number
            const versions = data
              .map(q => q.quote_number)
              .filter(qn => qn && qn.includes('.'))
              .map(qn => {
                const versionPart = qn.split('.')[1];
                return versionPart ? parseInt(versionPart) : 0;
              })
              .filter(v => !isNaN(v));
            
            if (versions.length > 0) {
              nextVersion = Math.max(...versions) + 1;
            }
          }
          
          setQuoteNumber(`${baseQuoteNumber}.${nextVersion}`);
        } catch (err) {
          console.error('Error generating version number:', err);
          const baseQuoteNumber = quote.quoteNumber?.split('.')[0] || "3500";
          setQuoteNumber(`${baseQuoteNumber}.1`);
        }
      }
    };

    generateNextVersionNumber();
  }, [quote, user, open]);

  // Fetch quote items when quote changes
  useEffect(() => {
    if (quote && open) {
      fetchQuoteItems();
    }
  }, [quote, open]);

  const fetchQuoteItems = async () => {
    if (!quote) return;
    
    try {
      const { data: items, error } = await supabase
        .from('quote_items')
        .select(`
          *,
          item:items(*),
          address:client_addresses(*)
        `)
        .eq('quote_id', quote.id);

      if (error) {
        console.error('Error fetching quote items:', error);
        return;
      }

      if (items) {
        // Transform database items to QuoteItemData format
        const transformedItems: QuoteItemData[] = items.map(item => ({
          id: item.id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          charge_type: (item.charge_type as 'NRC' | 'MRC') || 'NRC',
          address_id: item.address_id,
          name: item.item?.name || '',
          description: item.item?.description || '',
          item: item.item,
          address: item.address
        }));
        
        setQuoteItems(transformedItems);
      }
    } catch (err) {
      console.error('Exception fetching quote items:', err);
    }
  };

  // Update form when quote changes
  useEffect(() => {
    if (quote) {
      setClientId(quote.clientId);
      setClientInfoId(quote.clientInfoId || "");
      setDate(quote.date);
      setDescription(quote.description || "");
      // Don't set the quote number here - let the version generation handle it
      setQuoteMonth(quote.quoteMonth || "");
      setQuoteYear(quote.quoteYear || "");
      setStatus(quote.status || "pending");
      setExpiresAt(quote.expiresAt || "");
      setNotes(quote.notes || "");
      setCommissionOverride(quote.commissionOverride?.toString() || "");
    }
  }, [quote]);

  // Calculate total amount from quote items by charge type
  const calculateTotalsByChargeType = (items: QuoteItemData[]) => {
    const nrcTotal = items
      .filter(item => item.charge_type === 'NRC')
      .reduce((total, item) => total + item.total_price, 0);
    
    const mrcTotal = items
      .filter(item => item.charge_type === 'MRC')
      .reduce((total, item) => total + item.total_price, 0);
    
    return { nrcTotal, mrcTotal, totalAmount: nrcTotal + mrcTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quote && clientId && date) {
      const selectedClient = clients.find(client => client.id === clientId);
      const selectedClientInfo = clientInfoId && clientInfoId !== "none" ? clientInfos.find(info => info.id === clientInfoId) : null;
      
      if (selectedClient) {
        const { totalAmount } = calculateTotalsByChargeType(quoteItems);
        
        // Update quote items in database with all fields including charge_type and address_id
        try {
          // Delete existing quote items
          await supabase
            .from('quote_items')
            .delete()
            .eq('quote_id', quote.id);

          // Insert updated quote items with all necessary fields including charge_type and address_id
          if (quoteItems.length > 0) {
            const itemsToInsert = quoteItems.map(item => ({
              quote_id: quote.id,
              item_id: item.item_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              charge_type: item.charge_type,
              address_id: item.address_id || null // Now properly saving the address_id
            }));

            const { error: insertError } = await supabase
              .from('quote_items')
              .insert(itemsToInsert);

            if (insertError) {
              console.error('Error inserting quote items:', insertError);
            }
          }
        } catch (err) {
          console.error('Error updating quote items:', err);
        }

        onUpdateQuote({
          ...quote,
          clientId,
          clientName: selectedClient.name,
          companyName: selectedClient.companyName || selectedClient.name,
          amount: totalAmount,
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quote</DialogTitle>
          <DialogDescription>
            Update the quote details and items. A new version number will be assigned.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="quoteNumber">Quote Number (New Version)</Label>
              <Input
                id="quoteNumber"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                placeholder="Auto-generated version number"
                className="bg-muted"
                readOnly
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

          {/* Quote Items Section */}
          <div className="border-t pt-4">
            <QuoteItemsManager
              items={quoteItems}
              onItemsChange={setQuoteItems}
              clientInfoId={clientInfoId !== "none" ? clientInfoId : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date</Label>
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
            >
              Update Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
