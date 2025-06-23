
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientInfo } from "@/pages/Index";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";

interface EditClientInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateClientInfo: (clientInfo: ClientInfo) => void;
  clientInfo: ClientInfo | null;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
}

export const EditClientInfoDialog = ({ 
  open, 
  onOpenChange, 
  onUpdateClientInfo, 
  clientInfo 
}: EditClientInfoDialogProps) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ClientInfo>({
    defaultValues: {
      company_name: "",
      notes: "",
      revio_id: "",
      agent_id: null,
      commission_override: null
    }
  });

  // Fetch agents when dialog opens
  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  // Reset form and set selected agent when clientInfo changes or dialog opens
  useEffect(() => {
    if (clientInfo && open && agents.length > 0) {
      console.log('[EditClient] Resetting form with clientInfo:', clientInfo);
      reset({
        ...clientInfo,
        agent_id: clientInfo.agent_id || null
      });
      
      // Set the selectedAgentId after agents are loaded
      const agentId = clientInfo.agent_id;
      if (agentId && agents.some(agent => agent.id === agentId)) {
        setSelectedAgentId(agentId);
      } else {
        setSelectedAgentId("none");
      }
    }
  }, [clientInfo, open, reset, agents]);

  const fetchAgents = async () => {
    console.log('[EditClient] Starting agent fetch...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, first_name, last_name, email, company_name')
        .order('last_name', { ascending: true });
      
      console.log('[EditClient] Agents query result - Data:', data, 'Error:', error);
      
      if (error) {
        console.error('Error fetching agents:', error);
        setAgents([]);
      } else {
        if (data && Array.isArray(data)) {
          const processedAgents = data
            .filter(agent => agent && (agent.first_name || agent.last_name))
            .map(agent => ({
              id: agent.id,
              first_name: agent.first_name || '',
              last_name: agent.last_name || '',
              email: agent.email || '',
              company_name: agent.company_name || ''
            }));
          
          console.log('[EditClient] Setting agents:', processedAgents);
          setAgents(processedAgents);
        } else {
          setAgents([]);
        }
      }
    } catch (err) {
      console.error('Exception in agent fetch:', err);
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setSelectedAgentId("");
    }
    onOpenChange(newOpen);
  };

  const handleAgentSelect = (value: string) => {
    console.log('[EditClient] Agent selected:', value);
    setSelectedAgentId(value);
    setValue("agent_id", value === "none" ? null : value);
  };

  const onSubmit = (data: ClientInfo) => {
    if (clientInfo) {
      const updatedData = {
        ...clientInfo,
        ...data,
        agent_id: selectedAgentId === "none" || selectedAgentId === "" ? null : selectedAgentId
      };
      
      onUpdateClientInfo(updatedData);
      onOpenChange(false);
    }
  };

  if (!clientInfo) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client details and associate with an agent. Use the contacts section to manage contact information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-company_name" className="required">Company Name</Label>
            <Input
              id="edit-company_name"
              {...register("company_name", { required: "Company name is required" })}
              placeholder="Enter company name"
            />
            {errors.company_name && (
              <p className="text-sm text-red-500">{errors.company_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-revio_id">Revio ID</Label>
            <Input
              id="edit-revio_id"
              {...register("revio_id")}
              placeholder="Enter Revio accounting system ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-agent_id">Associated Agent</Label>
            <Select value={selectedAgentId} onValueChange={handleAgentSelect}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading agents..." : "Select an agent"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {`${agent.first_name} ${agent.last_name}${agent.company_name ? ` (${agent.company_name})` : ''}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {agents.length === 0 && !isLoading && (
              <p className="text-sm text-gray-500">No agents available</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-commission_override">Commission Override (%)</Label>
            <Input
              id="edit-commission_override"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("commission_override", {
                setValueAs: (value) => value === "" ? null : parseFloat(value)
              })}
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
              {...register("notes")}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Client
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
