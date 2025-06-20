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
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ClientInfo>({
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
      setSelectedUserId(clientInfo.agent_id || "none");
    }
  }, [clientInfo, open, reset]);

  // Fetch users when dialog opens
  const fetchUsers = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('[EditClient] Starting user fetch...');
      console.log('[EditClient] Current user auth state:', await supabase.auth.getUser());
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });
      
      console.log('[EditClient] Raw supabase response:', { data, error });
      
      if (error) {
        console.error('[EditClient] Error fetching users:', error);
        console.error('[EditClient] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setUsers([]);
      } else {
        console.log('[EditClient] Successful fetch - data:', data);
        console.log('[EditClient] Data type:', typeof data);
        console.log('[EditClient] Data length:', data?.length);
        console.log('[EditClient] First item:', data?.[0]);
        
        if (data && Array.isArray(data)) {
          const processedUsers = data
            .filter(user => user && (user.full_name || user.email))
            .map(user => ({
              id: user.id,
              full_name: user.full_name || '',
              email: user.email || ''
            }));
          
          console.log('[EditClient] Processed users:', processedUsers);
          setUsers(processedUsers);
        } else {
          console.log('[EditClient] No valid data returned');
          setUsers([]);
        }
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
      setSelectedUserId("");
    }
    onOpenChange(newOpen);
  };

  const handleUserSelect = (value: string) => {
    console.log('[EditClient] User selected:', value);
    setSelectedUserId(value);
    setValue("agent_id", value === "none" ? null : value);
  };

  const onSubmit = (data: ClientInfo) => {
    if (clientInfo) {
      const updatedData = {
        ...clientInfo,
        ...data,
        agent_id: selectedUserId === "none" || selectedUserId === "" ? null : selectedUserId
      };
      
      console.log('[EditClient] Submitting updated data:', updatedData);
      onUpdateClientInfo(updatedData);
      onOpenChange(false);
    }
  };

  if (!clientInfo) return null;

  console.log('[EditClient] Render state - Users:', users.length, 'Loading:', isLoading, 'Selected:', selectedUserId);

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
            <Select value={selectedUserId} onValueChange={handleUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading users..." : "Select a user"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email || `User ${user.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Debug: Users available: {users.length}</p>
              <p>Debug: Loading: {isLoading ? 'true' : 'false'}</p>
              <p>Debug: Selected: {selectedUserId || 'none'}</p>
              {!isLoading && users.length === 0 && <p className="text-red-500">No users found - check RLS policies</p>}
            </div>
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
