import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { AddClientInfoData } from "@/types/clientManagement";

interface AddClientInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClientInfo: (newClientInfo: AddClientInfoData) => Promise<void>;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

export const AddClientInfoDialog = ({ 
  open, 
  onOpenChange, 
  onAddClientInfo 
}: AddClientInfoDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddClientInfoData>({
    defaultValues: {
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      notes: "",
      revio_id: "",
      agent_id: null,
      commission_override: null
    }
  });

  // Fetch users when dialog opens
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 ADD CLIENT - Starting user fetch...');
      
      // Get current session info
      const { data: session } = await supabase.auth.getSession();
      console.log('📝 Current session user:', session?.session?.user?.email);
      
      // Try the profiles query
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });
      
      console.log('📊 Profiles query result:', {
        data,
        error,
        dataLength: data?.length || 0
      });
      
      if (error) {
        console.error('❌ Error fetching users:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else {
        console.log('✅ Successfully fetched users:', data);
        setUsers(data || []);
      }
    } catch (err) {
      console.error('💥 Exception in user fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchUsers();
    } else {
      reset();
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: AddClientInfoData) => {
    setIsSubmitting(true);
    try {
      await onAddClientInfo(data);
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error('Error adding client info:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your database.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="required">Company Name</Label>
            <Input
              id="company_name"
              {...register("company_name", { required: "Company name is required" })}
              placeholder="Enter company name"
            />
            {errors.company_name && (
              <p className="text-sm text-red-500">{errors.company_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              {...register("contact_name")}
              placeholder="Enter contact person's name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="revio_id">Revio ID</Label>
            <Input
              id="revio_id"
              {...register("revio_id")}
              placeholder="Enter Revio accounting system ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_id">Associated User</Label>
            <Select 
              onValueChange={(value) => setValue("agent_id", value === "none" ? null : value)}
              defaultValue="none"
            >
              <SelectTrigger id="agent_id" className="w-full bg-white border-gray-300">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="none">None</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoading && <p className="text-sm text-muted-foreground">Loading users...</p>}
            <div className="text-xs text-gray-500">
              Found {users.length} users
              {users.length > 0 && (
                <div className="mt-1">
                  Users: {users.map(u => u.full_name || u.email).join(', ')}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_override">Commission Override (%)</Label>
            <Input
              id="commission_override"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("commission_override", {
                setValueAs: (value) => value === "" ? null : parseFloat(value)
              })}
              placeholder="Enter commission rate override (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Optional. This will override the agent's commission rate for this client's transactions.
            </p>
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
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
