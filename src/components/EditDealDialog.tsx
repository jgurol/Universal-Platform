import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClientInfo } from "@/types/index";

interface DealRegistration {
  id: string;
  client_name: string;
  client_info_id: string | null;
  location: string;
  deal_value: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface EditDealDialogProps {
  deal: DealRegistration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated: () => void;
  clientInfos: ClientInfo[];
}

export const EditDealDialog = ({
  deal,
  open,
  onOpenChange,
  onDealUpdated,
  clientInfos
}: EditDealDialogProps) => {
  const [clientName, setClientName] = useState("");
  const [clientInfoId, setClientInfoId] = useState<string>("");
  const [location, setLocation] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when dialog opens/closes or deal changes
  useEffect(() => {
    if (open && deal) {
      setClientName(deal.client_name || "");
      setClientInfoId(deal.client_info_id || "");
      setLocation(deal.location || "");
      setDealValue(deal.deal_value?.toString() || "");
      setStatus(deal.status || "pending");
      setNotes(deal.notes || "");
    } else if (!open) {
      // Reset form when dialog closes
      setClientName("");
      setClientInfoId("");
      setLocation("");
      setDealValue("");
      setStatus("pending");
      setNotes("");
    }
  }, [open, deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deal) return;
    
    if (!clientName.trim()) {
      toast({
        title: "Error",
        description: "Client name is required",
        variant: "destructive",
      });
      return;
    }

    if (!location.trim()) {
      toast({
        title: "Error", 
        description: "Location is required",
        variant: "destructive",
      });
      return;
    }

    if (!dealValue || isNaN(Number(dealValue)) || Number(dealValue) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid deal value",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('deal_registrations')
        .update({
          client_name: clientName.trim(),
          client_info_id: clientInfoId || null,
          location: location.trim(),
          deal_value: Number(dealValue),
          status,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deal registration updated successfully",
      });

      onDealUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating deal registration:', error);
      toast({
        title: "Error",
        description: "Failed to update deal registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Deal Registration</DialogTitle>
          <DialogDescription>
            Update the deal registration details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientInfo">Client Company (Optional)</Label>
            <Select value={clientInfoId} onValueChange={setClientInfoId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No client company</SelectItem>
                {clientInfos.map((clientInfo) => (
                  <SelectItem key={clientInfo.id} value={clientInfo.id}>
                    {clientInfo.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dealValue">Deal Value ($) *</Label>
            <Input
              id="dealValue"
              type="number"
              step="0.01"
              min="0"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="Enter deal value"
              required
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
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the deal"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
