
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAgentAgreementTemplates } from "@/hooks/useAgentAgreementTemplates";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClient: (client: any) => void;
  onFetchClients?: () => void;
}

export const AddClientDialog = ({ open, onOpenChange, onAddClient, onFetchClients }: AddClientDialogProps) => {
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [optOutOfCommission, setOptOutOfCommission] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const { toast } = useToast();

  const { templates, isLoading: templatesLoading } = useAgentAgreementTemplates();

  // Set default template when templates load
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      } else {
        setSelectedTemplateId(templates[0].id);
      }
    }
  }, [templates, selectedTemplateId]);

  // Handle commission opt-out
  useEffect(() => {
    if (optOutOfCommission) {
      setCommissionRate("0");
    }
  }, [optOutOfCommission]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (firstName && lastName && email) {
      const finalCommissionRate = optOutOfCommission ? 0 : parseFloat(commissionRate);
      
      if (!optOutOfCommission && (isNaN(finalCommissionRate) || finalCommissionRate < 0 || finalCommissionRate > 100)) {
        toast({
          title: "Invalid Commission Rate",
          description: "Commission rate must be between 0 and 100",
          variant: "destructive"
        });
        return;
      }
      
      const newClient = {
        firstName,
        lastName,
        companyName,
        email,
        commissionRate: finalCommissionRate,
        selectedTemplateId: selectedTemplateId || undefined
      };
      
      onAddClient(newClient);
      
      // Reset form
      setCompanyName("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setCommissionRate("");
      setOptOutOfCommission(false);
      setSelectedTemplateId("");
      onOpenChange(false);
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Salesperson</DialogTitle>
          <DialogDescription>
            Add a new salesperson to your commission system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Salesperson Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter salesperson name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter agent email"
              required
            />
          </div>
          
          {/* Commission Opt-out Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="optOutOfCommission"
              checked={optOutOfCommission}
              onCheckedChange={(checked) => setOptOutOfCommission(checked === true)}
            />
            <Label htmlFor="optOutOfCommission" className="text-sm font-medium">
              Opt out of commission (no commission percentage)
            </Label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="commission">Commission Rate (%)</Label>
            <Input
              id="commission"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => {
                if (!optOutOfCommission) {
                  setCommissionRate(e.target.value);
                }
              }}
              placeholder="Enter commission rate"
              disabled={optOutOfCommission}
              required={!optOutOfCommission}
              className={optOutOfCommission ? "bg-gray-100 cursor-not-allowed" : ""}
            />
            {optOutOfCommission && (
              <p className="text-xs text-gray-500">
                Commission is disabled for this salesperson
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agreementTemplate">Agreement Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder={templatesLoading ? "Loading templates..." : "Select a template"} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} {template.is_default && "(Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && !templatesLoading && (
              <p className="text-xs text-yellow-600">
                No agreement templates found. The agent will receive a default template.
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Add Salesperson
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
