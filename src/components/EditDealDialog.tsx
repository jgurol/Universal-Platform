
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
import { DealFileUpload } from "@/components/DealFileUpload";

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

  const { register, handleSubmit, reset, setValue, watch, getValues, formState: { errors } } = useForm<DealRegistration>();

  const selectedStage = watch('stage');
  const selectedStatus = watch('status');
  const selectedClientId = watch('client_info_id');
  const selectedAgentId = watch('agent_id');

  useEffect(() => {
    if (deal && open) {
      console.log('Setting form data for deal:', deal);
      // Reset form with all deal data
      const formData = {
        ...deal,
        expected_close_date: deal.expected_close_date || null,
        agent_id: deal.agent_id || null,
        client_info_id: deal.client_info_id || null
      };
      reset(formData);
      
      // Force set the values after reset to ensure they're properly tracked
      setTimeout(() => {
        if (deal.agent_id) {
          setValue('agent_id', deal.agent_id);
        }
        if (deal.client_info_id) {
          setValue('client_info_id', deal.client_info_id);
        }
      }, 0);
    }
  }, [deal, open, reset, setValue]);

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
        console.log('Fetched agents:', data);
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
    }
    onOpenChange(newOpen);
  };

  const onSubmit = (data: DealRegistration) => {
    console.log('Submitting deal update:', data);
    if (deal) {
      onUpdateDeal({
        ...deal,
        ...data
      });
      onOpenChange(false);
    }
  };

  if (!deal) return null;

  console.log('Current deal agent_id:', deal.agent_id);
  console.log('Selected agent_id from form:', selectedAgentId);

  // Get the current agent_id value, either from watch or from the form values
  const currentAgentId = selectedAgentId || getValues('agent_id') || deal.agent_id;
  const currentClientId = selectedClientId || getValues('client_info_id') || deal.client_info_id;

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
              <Select value={selectedStage || deal.stage || ''} onValueChange={(value) => setValue("stage", value)}>
                <SelectTrigger className="text-left">
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
              <Select value={selectedStatus || deal.status || ''} onValueChange={(value) => setValue("status", value)}>
                <SelectTrigger className="text-left">
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
                value={currentClientId || "none"} 
                onValueChange={(value) => setValue("client_info_id", value === "none" ? null : value)}
              >
                <SelectTrigger className="text-left">
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
                value={currentAgentId || "none"} 
                onValueChange={(value) => {
                  console.log('Agent selection changed to:', value);
                  setValue("agent_id", value === "none" ? null : value);
                }}
              >
                <SelectTrigger className="text-left">
                  <SelectValue placeholder={isLoading ? "Loading agents..." : "Select agent"} />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
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

          <DealFileUpload dealId={deal?.id} />

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
