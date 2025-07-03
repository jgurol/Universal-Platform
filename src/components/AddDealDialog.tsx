
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { AddDealData, DealRegistration } from "@/services/dealRegistrationService";
import { ClientInfo } from "@/pages/Index";
import { TempDealNotes } from "@/components/TempDealNotes";
import { TempDealFileUpload } from "@/components/TempDealFileUpload";


interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDeal: (newDeal: AddDealData) => Promise<DealRegistration | null>;
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
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);
  const [pendingNotes, setPendingNotes] = useState<{id: string, content: string, timestamp: string, userName: string}[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddDealData>({
    defaultValues: {
      deal_name: "",
      deal_value: 0,
      expected_close_date: null,
      client_info_id: null,
      agent_id: null
    }
  });

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
      setCreatedDealId(null);
      setPendingNotes([]);
      setPendingFiles([]);
    }
    onOpenChange(newOpen);
  };

  const savePendingData = async (dealId: string) => {
    if (!user) return;

    // Save pending notes
    for (const note of pendingNotes) {
      try {
        await supabase
          .from('deal_registration_notes')
          .insert({
            deal_registration_id: dealId,
            user_id: user.id,
            content: note.content
          });
      } catch (error) {
        console.error('Error saving note:', error);
      }
    }

    // Save pending files
    for (const file of pendingFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('deal-registration-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        await supabase
          .from('deal_registration_documents')
          .insert({
            deal_registration_id: dealId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            uploaded_by: user.id
          });
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  const onSubmit = async (data: AddDealData) => {
    setIsSubmitting(true);
    try {
      const dealData = await onAddDeal(data);
      if (dealData) {
        setCreatedDealId(dealData.id);
        
        // Save pending notes and files
        await savePendingData(dealData.id);
        
        reset();
        
        toast({
          title: "Deal created",
          description: "Deal and all notes/files have been saved successfully.",
        });
      }
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

          <TempDealNotes 
            notes={pendingNotes} 
            onNotesChange={setPendingNotes} 
            disabled={!!createdDealId}
          />
          
          <TempDealFileUpload 
            files={pendingFiles} 
            onFilesChange={setPendingFiles} 
            disabled={!!createdDealId}
          />

          {createdDealId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">✅ Deal created successfully!</p>
              <p className="text-green-600 text-sm">You can now add notes and upload files above.</p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            {!createdDealId ? (
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Deal'}
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={() => handleOpenChange(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Done
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
