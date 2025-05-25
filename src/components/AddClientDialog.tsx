
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Client } from "@/pages/Index";
import { useForm } from "react-hook-form";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClient: (newClient: Omit<Client, "id" | "totalEarnings" | "lastPayment">) => Promise<void>;
  onFetchClients: () => Promise<void>;
}

export const AddClientDialog = ({
  open,
  onOpenChange,
  onAddClient,
  onFetchClients
}: AddClientDialogProps) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      commissionRate: 10,
    }
  });
  
  const onSubmit = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    commissionRate: number;
  }) => {
    await onAddClient({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      companyName: data.companyName || null,
      commissionRate: Number(data.commissionRate),
      name: `${data.firstName} ${data.lastName}`,
    });
    reset();
    onOpenChange(false);
    onFetchClients();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Salesperson</DialogTitle>
          <DialogDescription>
            Add a new salesperson to receive commission payments
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName"
                {...register("firstName", { required: "First name is required" })}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName"
                {...register("lastName", { required: "Last name is required" })}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email"
              {...register("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name (Optional)</Label>
            <Input 
              id="companyName"
              {...register("companyName")}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="commissionRate">Commission Rate (%)</Label>
            <Input 
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              {...register("commissionRate", { 
                required: "Commission rate is required",
                min: {
                  value: 0,
                  message: "Commission rate cannot be negative"
                },
                max: {
                  value: 100,
                  message: "Commission rate cannot exceed 100%"
                }
              })}
            />
            {errors.commissionRate && (
              <p className="text-sm text-red-500">{errors.commissionRate.message}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Add Salesperson</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
