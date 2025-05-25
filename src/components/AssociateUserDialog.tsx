
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_associated: boolean;
  created_at: string;
  associated_agent_name?: string | null;
  associated_agent_id?: string | null;
}

interface Agent {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
}

interface AssociateUserDialogProps {
  user: UserProfile;
  agents: Agent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateUser: (user: UserProfile) => void;
}

export const AssociateUserDialog = ({ 
  user, 
  agents,
  open, 
  onOpenChange, 
  onUpdateUser 
}: AssociateUserDialogProps) => {
  const { toast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssociate = async () => {
    if (!selectedAgentId) {
      toast({
        title: "Selection required",
        description: "Please select a salesperson to associate with",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the selected agent
      const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
      if (!selectedAgent) {
        toast({
          title: "Association failed",
          description: "Selected salesperson not found",
          variant: "destructive",
        });
        return;
      }

      // Update the user's profile with the agent ID directly
      const { error } = await supabase
        .from('profiles')
        .update({ 
          associated_agent_id: selectedAgentId,
          is_associated: true
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error associating user:", error);
        toast({
          title: "Association failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Create a more detailed agent name that includes company name
      const associatedAgentName = `${selectedAgent.first_name} ${selectedAgent.last_name} (${selectedAgent.company_name || 'No Company'})`;

      const updatedUser = {
        ...user,
        associated_agent_id: selectedAgentId,
        associated_agent_name: associatedAgentName,
        is_associated: true,
      };
      
      toast({
        title: "User associated",
        description: "User has been successfully associated with the salesperson",
      });

      onUpdateUser(updatedUser);
      onOpenChange(false);
      setSelectedAgentId("");
    } catch (error: any) {
      console.error("Exception associating user:", error);
      toast({
        title: "Association error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Associate User</DialogTitle>
          <DialogDescription>
            Associate {user.full_name || user.email} with a salesperson.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Salesperson</label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a salesperson" />
              </SelectTrigger>
              <SelectContent>
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {`${agent.first_name} ${agent.last_name} (${agent.company_name || 'No Company'})`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-agents" disabled>
                    No salespersons available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              setSelectedAgentId("");
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssociate} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Associating..." : "Associate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
