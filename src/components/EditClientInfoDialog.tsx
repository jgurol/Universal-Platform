
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientInfo } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";

interface EditClientInfoDialogProps {
  clientInfo: ClientInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateClientInfo: (clientInfo: ClientInfo) => void;
}

interface Agent {
  id: string;
  company_name: string;
  first_name: string;
  last_name: string;
}

export const EditClientInfoDialog = ({ 
  clientInfo, 
  open, 
  onOpenChange, 
  onUpdateClientInfo 
}: EditClientInfoDialogProps) => {
  const [companyName, setCompanyName] = useState(clientInfo.company_name);
  const [contactName, setContactName] = useState(clientInfo.contact_name || "");
  const [email, setEmail] = useState(clientInfo.email || "");
  const [phone, setPhone] = useState(clientInfo.phone || "");
  const [notes, setNotes] = useState(clientInfo.notes || "");
  const [revioId, setRevioId] = useState(clientInfo.revio_id || "");
  const [agentId, setAgentId] = useState<string | null>(clientInfo.agent_id || null);
  const [commissionOverride, setCommissionOverride] = useState<string>(
    clientInfo.commission_override?.toString() || ""
  );
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch agents when dialog opens
  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  // Update form when clientInfo changes
  useEffect(() => {
    setCompanyName(clientInfo.company_name);
    setContactName(clientInfo.contact_name || "");
    setEmail(clientInfo.email || "");
    setPhone(clientInfo.phone || "");
    setNotes(clientInfo.notes || "");
    setRevioId(clientInfo.revio_id || "");
    setAgentId(clientInfo.agent_id || null);
    setCommissionOverride(clientInfo.commission_override?.toString() || "");
  }, [clientInfo]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, company_name, first_name, last_name')
        .order('company_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching agents:', error);
      } else {
        setAgents(data || []);
      }
    } catch (err) {
      console.error('Error in agent fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName) {
      setIsSubmitting(true);
      try {
        await onUpdateClientInfo({
          ...clientInfo,
          company_name: companyName,
          contact_name: contactName || null,
          email: email || null,
          phone: phone || null,
          address: clientInfo.address,
          notes: notes || null,
          revio_id: revioId || null,
          agent_id: agentId === "none" ? null : agentId,
          commission_override: commissionOverride ? parseFloat(commissionOverride) : null
        });
        onOpenChange(false);
      } catch (err) {
        console.error('Error updating client info:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client's information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-companyName" className="required">Company Name</Label>
            <Input
              id="edit-companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contactName">Contact Name</Label>
            <Input
              id="edit-contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Enter contact person's name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-revioId">Revio ID</Label>
            <Input
              id="edit-revioId"
              value={revioId}
              onChange={(e) => setRevioId(e.target.value)}
              placeholder="Enter Revio accounting system ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-agent">Associated Agent</Label>
            <Select value={agentId || undefined} onValueChange={setAgentId}>
              <SelectTrigger id="edit-agent" className="w-full">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.company_name || `${agent.first_name} ${agent.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoading && <p className="text-sm text-muted-foreground">Loading agents...</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-commissionOverride">Commission Override (%)</Label>
            <Input
              id="edit-commissionOverride"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commissionOverride}
              onChange={(e) => setCommissionOverride(e.target.value)}
              placeholder="Enter commission rate override (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Optional. This will override the agent's commission rate for this client's transactions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !companyName}
            >
              {isSubmitting ? 'Updating...' : 'Update Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
