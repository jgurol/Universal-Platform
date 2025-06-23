
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Client, Transaction } from "@/types/index";
import { useToast } from "@/hooks/use-toast";

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateClient: (client: Client) => void;
  transactions?: Transaction[];
  onUpdateTransactions?: (transactions: Transaction[]) => void;
}

export const EditClientDialog = ({ 
  client, 
  open, 
  onOpenChange, 
  onUpdateClient, 
  transactions = [], 
  onUpdateTransactions 
}: EditClientDialogProps) => {
  const [companyName, setCompanyName] = useState(client.companyName || "");
  const [firstName, setFirstName] = useState(client.firstName || "");
  const [lastName, setLastName] = useState(client.lastName || "");
  const [email, setEmail] = useState(client.email);
  const [commissionRate, setCommissionRate] = useState(client.commissionRate.toString());
  const { toast } = useToast();

  useEffect(() => {
    setCompanyName(client.companyName || "");
    setFirstName(client.firstName || "");
    setLastName(client.lastName || "");
    setEmail(client.email);
    setCommissionRate(client.commissionRate.toString());
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (firstName && lastName && email && commissionRate) {
      const parsedRate = parseFloat(commissionRate);
      
      if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
        toast({
          title: "Invalid Commission Rate",
          description: "Commission rate must be between 0 and 100",
          variant: "destructive"
        });
        return;
      }
      
      const updatedClient = {
        ...client,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // Update full name from first and last name
        companyName,
        email,
        commissionRate: parsedRate,
      };
      
      // Call the update function which will handle the database update
      onUpdateClient(updatedClient);
      
      // Update commission calculations for unpaid commissions
      if (onUpdateTransactions && transactions.length > 0) {
        const newRate = parsedRate;
        // Only recalculate for transactions that belong to this client and don't have paid commissions
        const updatedTransactions = transactions.map(transaction => {
          if (transaction.clientId === client.id && !transaction.commissionPaidDate) {
            // Recalculate commission based on the new rate
            return {
              ...transaction,
              commission: transaction.amount * (newRate / 100)
            };
          }
          return transaction;
        });
        
        onUpdateTransactions(updatedTransactions);
      }
      
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
          <DialogTitle>Edit Salesperson</DialogTitle>
          <DialogDescription>
            Update the salesperson details and commission rate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-companyName">Salesperson Name</Label>
            <Input
              id="edit-companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter salesperson name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-firstName">First Name</Label>
            <Input
              id="edit-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-lastName">Last Name</Label>
            <Input
              id="edit-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter agent email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-commission">Commission Rate (%)</Label>
            <Input
              id="edit-commission"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="Enter commission rate"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Update Salesperson
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
