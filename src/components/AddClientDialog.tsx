import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    
    try {
      const newClient: Omit<Client, "id" | "totalEarnings" | "lastPayment"> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        companyName: formData.companyName,
        commissionRate: parseFloat(formData.commissionRate),
      };

      // Add the client first
      await onAddClient(newClient);
      
      // If client was added successfully, send agent agreement email
      try {
        const { data, error } = await supabase.functions.invoke('send-agent-agreement', {
          body: {
            agentId: 'temp-id', // This will be updated after we refactor to get the actual ID
            agentEmail: formData.email,
            agentName: `${formData.firstName} ${formData.lastName}`,
            commissionRate: parseFloat(formData.commissionRate)
          }
        });

        if (error) {
          console.error('Error sending agent agreement email:', error);
          toast({
            title: "Agent added but email failed",
            description: "The agent was added successfully, but we couldn't send the agreement email. Please try again later.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Agent added and email sent!",
            description: `${formData.firstName} ${formData.lastName} has been added and will receive an agreement email shortly.`,
          });
        }
      } catch (emailError) {
        console.error('Error sending agreement email:', emailError);
        toast({
          title: "Agent added but email failed",
          description: "The agent was added successfully, but we couldn't send the agreement email.",
          variant: "destructive"
        });
      }
      
      // Reset form and close dialog
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        companyName: "",
        commissionRate: "15",
      });
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Failed to add agent",
        description: "There was an error adding the agent. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          Add Salesperson
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Salesperson</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
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
