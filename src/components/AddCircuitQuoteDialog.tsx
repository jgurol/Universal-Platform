
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircuitQuote } from "@/components/CircuitQuotesManagement";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface AddCircuitQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddQuote: (quote: Omit<CircuitQuote, "id">) => void;
}

interface ClientOption {
  id: string;
  name: string;
  companyName: string | null;
}

export const AddCircuitQuoteDialog = ({ open, onOpenChange, onAddQuote }: AddCircuitQuoteDialogProps) => {
  const [clientId, setClientId] = useState("");
  const [location, setLocation] = useState("");
  const [suite, setSuite] = useState("");
  const [status, setStatus] = useState<"researching" | "quoted" | "published">("researching");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const fetchClients = async () => {
    if (!user) return;
    
    setIsLoadingClients(true);
    try {
      // Fetch from client_info table for actual clients
      const { data: clientInfoData, error: clientInfoError } = await supabase
        .from('client_info')
        .select('id, company_name, contact_name')
        .order('company_name', { ascending: true });

      if (clientInfoError) {
        console.error('Error fetching client info:', clientInfoError);
        return;
      }

      // Map client_info data to ClientOption format
      const clientOptions: ClientOption[] = (clientInfoData || []).map(client => ({
        id: client.id,
        name: client.contact_name || client.company_name,
        companyName: client.company_name
      }));

      setClients(clientOptions);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const resetForm = () => {
    setClientId("");
    setLocation("");
    setSuite("");
    setStatus("researching");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (clientId && location) {
      const selectedClient = clients.find(c => c.id === clientId);
      const clientName = selectedClient ? 
        (selectedClient.companyName || selectedClient.name) : 
        "Unknown Client";

      onAddQuote({
        client: clientName,
        location,
        suite,
        creationDate: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        status,
        carriers: []
      });
      
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Circuit Quote</DialogTitle>
          <DialogDescription>
            Create a new circuit quote to research carrier pricing.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client (Required)</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.companyName || client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Required)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location (e.g., City, State)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suite">Suite/Unit</Label>
            <Input
              id="suite"
              value={suite}
              onChange={(e) => setSuite(e.target.value)}
              placeholder="Enter suite or unit number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: "researching" | "quoted" | "published") => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="researching">Researching</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Create Quote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
