
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { DealRegistration } from "@/services/dealRegistrationService";
import { ClientInfo } from "@/pages/Index";

interface EditDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateDeal: (deal: DealRegistration) => void;
  deal: DealRegistration | null;
  clientInfos: ClientInfo[];
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
}

const dealStages = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed-won',
  'closed-lost'
];

const dealStatuses = [
  'active',
  'inactive',
  'completed'
];

export const EditDealDialog = ({ 
  open, 
  onOpenChange, 
  onUpdateDeal,
  deal,
  clientInfos 
}: EditDealDialogProps) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<DealRegistration>();

  const selectedStage = watch('stage');
  const selectedStatus = watch('status');

  useEffect(() => {
    if (deal && open) {
      reset({
        ...deal,
        expected_close_date: deal.expected_close_date || null
      });
      setSelectedClientId(deal.client_info_id);
      setSelectedAgentId(deal.agent_id);
    }
  }, [deal, open, reset]);

  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, first_name, last_name, company_name')
        .order('last_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching agents:', error);
        setAgents([]);
      } else {
        setAgents(data || []);
      }
    } catch (err) {
      console.error('Exception in fetchAgents:', err);
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setSelectedClientId(null);
      setSelectedAgentId(null);
    }
    onOpenChange(newOpen);
  };

  const handleClientChange = (clientId: string) => {
    const finalClientId = clientId === "none" ? null : clientId;
    setSelectedClientId(finalClientId);
    setValue("client_info_id", finalClientId);
  };

  const handleAgentChange = (agentId: string) => {
    const finalAgentId = agentId === "none" ? null : agentId;
    setSelectedAgentId(finalAgentId);
    setValue("agent_id", finalAgentId);
  };

  const onSubmit = (data: DealRegistration) => {
    if (deal) {
      onUpdateDeal({
        ...deal,
        ...data,
        client_info_id: selectedClientId,
        agent_id: selectedAgentId
      });
      onOpenChange(false);
    }
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
          <DialogDescription>
            Update the deal registration details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal_name" className="required">Deal Name</Label>
              <Input
                id="deal_name"
                {...register("deal_name", { required: "Deal name is required" })}
                placeholder="Enter deal name"
              />
              {errors.deal_name && (
                <p className="text-sm text-red-500">{errors.deal_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal_value" className="required">Deal Value ($)</Label>
              <Input
                id="deal_value"
                type="number"
                step="0.01"
                min="0"
                {...register("deal_value", { 
                  required: "Deal value is required",
                  min: { value: 0, message: "Deal value must be positive" }
                })}
                placeholder="0.00"
              />
              {errors.deal_value && (
                <p className="text-sm text-red-500">{errors.deal_value.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Deal Stage</Label>
              <Select value={selectedStage} onValueChange={(value) => setValue("stage", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {dealStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                {...register("probability", {
                  min: { value: 0, message: "Probability must be between 0 and 100" },
                  max: { value: 100, message: "Probability must be between 0 and 100" }
                })}
                placeholder="50"
              />
              {errors.probability && (
                <p className="text-sm text-red-500">{errors.probability.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setValue("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {dealStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date">Expected Close Date</Label>
            <Input
              id="expected_close_date"
              type="date"
              {...register("expected_close_date")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_info_id">Client</Label>
              <Select 
                value={selectedClientId || "none"} 
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {clientInfos.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent_id">Associated Agent</Label>
              <Select 
                value={selectedAgentId || "none"} 
                onValueChange={handleAgentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading agents..." : "Select agent"} />
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description of customer intention</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Example: Customer looking for both internet and phone service"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Agent notes for California Telecom</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Example: Customer currently has AT&T and does not want AT&T"
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
            >
              Update Deal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
