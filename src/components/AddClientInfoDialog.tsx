
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { AddClientInfoData } from "@/types/clientManagement";

interface AddClientInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClientInfo: (newClientInfo: AddClientInfoData) => Promise<void>;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
}

export const AddClientInfoDialog = ({ 
  open, 
  onOpenChange, 
  onAddClientInfo 
}: AddClientInfoDialogProps) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddClientInfoData>({
    defaultValues: {
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      notes: "",
      revio_id: "",
      agent_id: null,
      commission_override: null
    }
  });

  // Fetch agents when dialog opens
  const fetchAgents = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log('[AddClient] Fetching agents...');
      
      // First check authentication status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('[AddClient] Session check - Session exists:', !!session, 'Error:', sessionError);
      
      if (!session) {
        console.log('[AddClient] No active session found');
        setAgents([]);
        return;
      }
      
      console.log('[AddClient] Fetching agents from agents table...');
      
      // Fetch agents with specific fields
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id, first_name, last_name, email, company_name')
        .order('last_name', { ascending: true, nullsFirst: false });
      
      console.log('[AddClient] Agents query result - Data count:', agentData?.length || 0, 'Error:', agentError);
      console.log('[AddClient] Raw agent data:', agentData);
      
      if (agentError) {
        console.error('[AddClient] Agent error details:', agentError);
        setAgents([]);
      } else if (agentData && Array.isArray(agentData)) {
        console.log('[AddClient] Processing', agentData.length, 'agents...');
        
        // Process the agents data
        const processedAgents = agentData.map((agent, index) => {
          console.log('[AddClient] Agent', index, ':', agent);
          return {
            id: agent.id,
            first_name: agent.first_name || '',
            last_name: agent.last_name || '',
            email: agent.email || '',
            company_name: agent.company_name || ''
          };
        });
          
        console.log('[AddClient] Processed agents count:', processedAgents.length);
        console.log('[AddClient] Processed agents:', processedAgents);
        
        setAgents(processedAgents);
        console.log('[AddClient] Agents state updated successfully');
      } else {
        console.log('[AddClient] No agents found or agentData is not an array');
        setAgents([]);
      }
    } catch (err) {
      console.error('[AddClient] Exception in fetchAgents:', err);
      setAgents([]);
    } finally {
      setIsLoading(false);
      console.log('[AddClient] fetchAgents completed');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchAgents();
      setSelectedAgentId("");
    } else {
      reset();
      setSelectedAgentId("");
    }
    onOpenChange(newOpen);
  };

  const handleAgentSelect = (value: string) => {
    console.log('[AddClient] Agent selected:', value);
    setSelectedAgentId(value);
    setValue("agent_id", value === "none" ? null : value);
  };

  const onSubmit = async (data: AddClientInfoData) => {
    setIsSubmitting(true);
    try {
      const cleanedData = {
        ...data,
        agent_id: selectedAgentId === "none" || selectedAgentId === "" ? null : selectedAgentId
      };
      
      await onAddClientInfo(cleanedData);
      reset();
      setSelectedAgentId("");
      onOpenChange(false);
    } catch (err) {
      console.error('Error adding client info:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('[AddClient] Component render - agents.length:', agents.length, 'isLoading:', isLoading);
  console.log('[AddClient] Current agents state:', agents);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Debug section */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <strong>Debug Info:</strong><br/>
            Agents found: {agents.length}<br/>
            Loading: {isLoading ? 'Yes' : 'No'}<br/>
            Selected Agent ID: {selectedAgentId || 'None'}<br/>
            Dialog Open: {open ? 'Yes' : 'No'}<br/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name" className="required">Company Name</Label>
            <Input
              id="company_name"
              {...register("company_name", { required: "Company name is required" })}
              placeholder="Enter company name"
            />
            {errors.company_name && (
              <p className="text-sm text-red-500">{errors.company_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              {...register("contact_name")}
              placeholder="Enter contact person's name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="revio_id">Revio ID</Label>
            <Input
              id="revio_id"
              {...register("revio_id")}
              placeholder="Enter Revio accounting system ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_id">Associated Agent</Label>
            <div className="space-y-2">
              <div className="text-xs text-gray-500">
                Debug: {agents.length} agents available, loading: {isLoading ? 'true' : 'false'}
              </div>
              <Select value={selectedAgentId} onValueChange={handleAgentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading agents..." : "Select an agent"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {agents.length > 0 ? (
                    agents.map((agent) => {
                      console.log('[AddClient] Rendering agent option:', agent);
                      return (
                        <SelectItem key={agent.id} value={agent.id}>
                          {`${agent.first_name} ${agent.last_name} (${agent.company_name || 'No Company'})`}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-agents" disabled>
                      {isLoading ? 'Loading...' : 'No agents found'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_override">Commission Override (%)</Label>
            <Input
              id="commission_override"
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
