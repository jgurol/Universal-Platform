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
import { useAuth } from "@/context/AuthContext";

interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDeal: (newDeal: AddDealData) => Promise<void>;
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

export const AddDealDialog = ({ 
  open, 
  onOpenChange, 
  onAddDeal,
  clientInfos 
}: AddDealDialogProps) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddDealData>({
    defaultValues: {
      deal_name: "",
      deal_value: 0,
      expected_close_date: null,
      probability: 50,
      stage: "prospecting",
      description: null,
      notes: null,
      client_info_id: null,
      agent_id: null
    }
  });

  const selectedStage = watch('stage');

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
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: AddDealData) => {
    setIsSubmitting(true);
    try {
      await onAddDeal(data);
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error('Error adding deal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Deal</DialogTitle>
          <DialogDescription>
            Create a new deal registration for tracking opportunities.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Select onValueChange={(value) => setValue("client_info_id", value === "none" ? null : value)}>
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
              <Select onValueChange={(value) => setValue("agent_id", value === "none" ? null : value)}>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter deal description"
              rows={3}
            />
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
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
