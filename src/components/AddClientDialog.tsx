
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClient: (newClient: Omit<Client, "id" | "totalEarnings" | "lastPayment">) => Promise<void>;
  onFetchClients: () => void;
}

export function AddClientDialog({ open, onOpenChange, onAddClient, onFetchClients }: AddClientDialogProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    commissionRate: "15",
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First check if agent with this email already exists
      const { data: existingAgent, error: checkError } = await supabase
        .from('agents')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing agent:', checkError);
        toast({
          title: "Error checking agent",
          description: "There was an error checking if the agent already exists. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (existingAgent) {
        toast({
          title: "Agent already exists",
          description: `An agent with email ${formData.email} already exists in the system.`,
          variant: "destructive"
        });
        return;
      }

      const newClient: Omit<Client, "id" | "totalEarnings" | "lastPayment"> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        companyName: formData.companyName,
        commissionRate: parseFloat(formData.commissionRate),
      };

      // Add the client to the database first
      const { data, error } = await supabase
        .from('agents')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          company_name: formData.companyName,
          commission_rate: parseFloat(formData.commissionRate),
          total_earnings: 0,
          last_payment: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding agent:', error);
        
        // Handle specific error cases
        if (error.code === '23505' && error.message.includes('agents_email_key')) {
          toast({
            title: "Duplicate email address",
            description: `An agent with email ${formData.email} already exists. Please use a different email address.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Failed to add agent",
            description: error.message || "There was an error adding the agent. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      if (data) {
        // Now send the agreement email with the actual agent ID
        try {
          const { error: emailError } = await supabase.functions.invoke('send-agent-agreement', {
            body: {
              agentId: data.id, // Use the actual agent ID from the database
              agentEmail: data.email,
              agentName: `${data.first_name} ${data.last_name}`,
              commissionRate: data.commission_rate
            }
          });

          if (emailError) {
            console.error('Error sending agent agreement email:', emailError);
            toast({
              title: "Agent added but email failed",
              description: "The agent was added successfully, but we couldn't send the agreement email. Please try again later.",
              variant: "destructive"
            });
            // Still call the parent's onAddClient callback since agent was added
            await onAddClient(newClient);
          } else {
            toast({
              title: "Agent added and email sent!",
              description: `${formData.firstName} ${formData.lastName} has been added and will receive an agreement email shortly.`,
            });
            // Call the parent's onAddClient callback
            await onAddClient(newClient);
          }
        } catch (emailError) {
          console.error('Error sending agreement email:', emailError);
          toast({
            title: "Agent added but email failed",
            description: "The agent was added successfully, but we couldn't send the agreement email.",
            variant: "destructive"
          });
          // Still call the parent's onAddClient callback since agent was added
          await onAddClient(newClient);
        }

        // Reset form and close dialog regardless of email success/failure
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          companyName: "",
          commissionRate: "15",
        });
        onOpenChange(false);
      }
      
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Failed to add agent",
        description: "There was an unexpected error adding the agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Salesperson</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
            <Input
              id="commissionRate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={formData.commissionRate}
              onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: e.target.value }))}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Salesperson"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
