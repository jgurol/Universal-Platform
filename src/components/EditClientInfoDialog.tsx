import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientInfo } from "@/pages/Index";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";

interface EditClientInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateClientInfo: (clientInfo: ClientInfo) => void;
  clientInfo: ClientInfo | null;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

export const EditClientInfoDialog = ({ 
  open, 
  onOpenChange, 
  onUpdateClientInfo, 
  clientInfo 
}: EditClientInfoDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ClientInfo>({
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

  // Reset form when clientInfo changes
  useEffect(() => {
    if (clientInfo && open) {
      console.log('[EditClient] Resetting form with clientInfo:', clientInfo);
      reset({
        ...clientInfo,
        agent_id: clientInfo.agent_id || null
      });
    }
  }, [clientInfo, open, reset]);

  // Fetch users when dialog opens
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log('[EditClient] Starting to fetch users...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });
      
      if (error) {
        console.error('[EditClient] Error fetching users:', error);
        setUsers([]);
      } else {
        console.log('[EditClient] Raw data from Supabase:', data);
        console.log('[EditClient] Number of users fetched:', data?.length || 0);
        
        const validUsers = (data || []).filter(user => {
          const isValid = user.id && (user.full_name || user.email);
          console.log('[EditClient] User validation:', user, 'Valid:', isValid);
          return isValid;
        });
        
        console.log('[EditClient] Valid users after filtering:', validUsers);
        setUsers(validUsers);
      }
    } catch (err) {
      console.error('[EditClient] Exception in user fetch:', err);
      setUsers([]);
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

  const onSubmit = (data: ClientInfo) => {
    if (clientInfo) {
      const updatedData = {
        ...clientInfo,
        ...data,
        agent_id: (!data.agent_id || data.agent_id === "none" || data.agent_id === "") ? null : data.agent_id
      };
      
      console.log('[EditClient] Submitting updated data:', updatedData);
      onUpdateClientInfo(updatedData);
      onOpenChange(false);
    }
  };

  if (!clientInfo) return null;

  const currentAgentId = watch("agent_id");
  console.log('[EditClient] Current agent ID from form:', currentAgentId);
  console.log('[EditClient] Users state:', users);
  console.log('[EditClient] Is loading:', isLoading);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update the client details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-company_name" className="required">Company Name</Label>
            <Input
              id="edit-company_name"
              {...register("company_name", { required: "Company name is required" })}
              placeholder="Enter company name"
            />
            {errors.company_name && (
              <p className="text-sm text-red-500">{errors.company_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact_name">Contact Name</Label>
            <Input
              id="edit-contact_name"
              {...register("contact_name")}
              placeholder="Enter contact person's name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
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
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              {...register("phone")}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-revio_id">Revio ID</Label>
            <Input
              id="edit-revio_id"
              {...register("revio_id")}
              placeholder="Enter Revio accounting system ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-agent_id">Associated User</Label>
            <Select 
              value={currentAgentId || "none"}
              onValueChange={(value) => {
                console.log('[EditClient] Select value changed to:', value);
                setValue("agent_id", value === "none" ? null : value);
              }}
            >
              <SelectTrigger id="edit-agent_id" className="w-full bg-white border-gray-300">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select user"} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 max-h-60 overflow-y-auto">
                <SelectItem value="none">None</SelectItem>
                {users.map((user) => {
                  console.log('[EditClient] Rendering user option:', user);
                  return (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email || 'Unknown User'}
                    </SelectItem>
                  );
                })}
                {users.length === 0 && !isLoading && (
                  <SelectItem value="no-users" disabled>
                    No users found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {isLoading && <p className="text-sm text-muted-foreground">Loading users...</p>}
            <p className="text-xs text-muted-foreground">
              Users found: {users.length}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-commission_override">Commission Override (%)</Label>
            <Input
              id="edit-commission_override"
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
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              {...register("notes")}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Client
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
