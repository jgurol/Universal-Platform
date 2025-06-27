
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Client, Transaction } from "@/pages/Index";
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
  const [optOutOfCommission, setOptOutOfCommission] = useState(client.commissionRate === 0);
  const { toast } = useToast();

  useEffect(() => {
    setCompanyName(client.companyName || "");
    setFirstName(client.firstName || "");
    setLastName(client.lastName || "");
    setEmail(client.email);
    setCommissionRate(client.commissionRate.toString());
    setOptOutOfCommission(client.commissionRate === 0);
  }, [client]);

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
      
      const updatedClient = {
        ...client,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // Update full name from first and last name
        companyName,
        email,
        commissionRate: finalCommissionRate,
      };
      
      // Call the update function which will handle the database update
      onUpdateClient(updatedClient);
      
      // Update commission calculations for unpaid commissions
      if (onUpdateTransactions && transactions.length > 0) {
        const newRate = finalCommissionRate;
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
          
          {/* Commission Opt-out Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-optOutOfCommission"
              checked={optOutOfCommission}
              onCheckedChange={(checked) => setOptOutOfCommission(checked === true)}
            />
            <Label htmlFor="edit-optOutOfCommission" className="text-sm font-medium">
              Opt out of commission (no commission percentage)
            </Label>
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
