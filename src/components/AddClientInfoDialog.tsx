
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { AddClientInfoData } from "@/types/clientManagement";
import { useCreditCheck } from "@/hooks/useCreditCheck";
import { CreditCheckResult } from "@/components/CreditCheckResult";

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
  const [showCreditCheck, setShowCreditCheck] = useState(false);

  const { creditResult, isLoading: creditLoading, performCreditCheck, clearCreditResult } = useCreditCheck();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddClientInfoData>({
    defaultValues: {
      company_name: "",
      notes: "",
      revio_id: "",
      agent_id: null,
      commission_override: null
    }
  });

  const companyName = watch("company_name");

  // Fetch agents when dialog opens
  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  // Remove the auto-trigger credit check effect to prevent loops
  // Users will manually trigger it with the button instead

  const fetchAgents = async () => {
    console.log('[AddClient] Starting agent fetch...');
    setIsLoading(true);
    
    try {
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id, first_name, last_name, email, company_name')
        .order('last_name', { ascending: true });
      
      console.log('[AddClient] Agents query result - Data:', agentData, 'Error:', agentError);
      
      if (agentError) {
        console.error('[AddClient] Agent error details:', agentError);
        setAgents([]);
      } else if (agentData && Array.isArray(agentData)) {
        const processedAgents = agentData
          .filter(agent => agent && (agent.first_name || agent.last_name))
          .map(agent => ({
            id: agent.id,
            first_name: agent.first_name || '',
            last_name: agent.last_name || '',
            email: agent.email || '',
            company_name: agent.company_name || ''
          }));
          
        console.log('[AddClient] Setting agents:', processedAgents);
        setAgents(processedAgents);
      } else {
        console.log('[AddClient] No agents found or agentData is not an array');
        setAgents([]);
      }
    } catch (err) {
      console.error('[AddClient] Exception in fetchAgents:', err);
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedAgentId("");
      setShowCreditCheck(false);
      clearCreditResult();
      reset();
    }
    onOpenChange(newOpen);
  };

  const handleAgentSelect = (value: string) => {
    console.log('[AddClient] Agent selected:', value);
    setSelectedAgentId(value);
    setValue("agent_id", value === "none" ? null : value);
  };

  const handleCreditCheckToggle = () => {
    if (!showCreditCheck && companyName) {
      setShowCreditCheck(true);
      performCreditCheck(companyName);
    } else {
      setShowCreditCheck(!showCreditCheck);
      if (!showCreditCheck) {
        clearCreditResult();
      }
    }
  };

  const onSubmit = async (data: AddClientInfoData) => {
    setIsSubmitting(true);
    try {
      const cleanedData = {
        ...data,
        agent_id: selectedAgentId === "none" || selectedAgentId === "" ? null : selectedAgentId
      };
      
      // Add the client first
      await onAddClientInfo(cleanedData);
      
      // If there's a credit check result, we need to get the client ID and store it
      if (creditResult && companyName) {
        try {
          // Fetch the newly created client to get the ID
          const { data: clientData, error } = await supabase
            .from('client_info')
            .select('id')
            .eq('company_name', cleanedData.company_name)
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!error && clientData) {
            await creditCheckService.storeCreditCheckResult(clientData.id, creditResult);
            console.log('[AddClient] Credit check result stored for new client');
          }
        } catch (err) {
          console.error('[AddClient] Error storing credit check result:', err);
          // Don't fail the entire operation if credit check storage fails
        }
      }
      
      reset();
      setSelectedAgentId("");
      setShowCreditCheck(false);
      clearCreditResult();
      onOpenChange(false);
    } catch (err) {
      console.error('Error adding client info:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your database. Contact information can be managed separately in the contacts section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="company_name" className="required">Company Name</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreditCheckToggle}
                disabled={!companyName || companyName.length < 3}
              >
                {showCreditCheck ? 'Hide Credit Check' : 'Run Credit Check'}
              </Button>
            </div>
            <Input
              id="company_name"
              {...register("company_name", { required: "Company name is required" })}
              placeholder="Enter company name"
            />
            {errors.company_name && (
              <p className="text-sm text-red-500">{errors.company_name.message}</p>
            )}
          </div>

          {showCreditCheck && (
            <CreditCheckResult 
              result={creditResult!} 
              isLoading={creditLoading}
            />
          )}

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
