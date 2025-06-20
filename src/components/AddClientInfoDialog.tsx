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
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddClientInfoData>({
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
    if (isLoading) return;
    
    setIsLoading(true);
    let debugLog = "Starting fetchUsers...\n";
    
    try {
      debugLog += "Checking authentication...\n";
      
      // First check authentication status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      debugLog += `Session check - Session exists: ${!!session}, Error: ${sessionError}\n`;
      
      if (!session) {
        debugLog += "No active session found\n";
        setUsers([]);
        setDebugInfo(debugLog);
        return;
      }
      
      debugLog += "Fetching profiles...\n";
      
      // Fetch profiles with specific fields
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true, nullsFirst: false });
      
      debugLog += `Profiles query result - Data count: ${profileData?.length || 0}, Error: ${profileError}\n`;
      debugLog += `Raw profile data: ${JSON.stringify(profileData, null, 2)}\n`;
      
      if (profileError) {
        debugLog += `Profile error details: ${JSON.stringify(profileError, null, 2)}\n`;
        setUsers([]);
      } else if (profileData && Array.isArray(profileData)) {
        debugLog += `Processing ${profileData.length} profiles...\n`;
        
        // Process the profiles into users format
        const processedUsers = profileData.map((profile, index) => {
          debugLog += `Profile ${index}: id=${profile.id}, full_name="${profile.full_name}", email="${profile.email}"\n`;
          return {
            id: profile.id,
            full_name: profile.full_name || '',
            email: profile.email || ''
          };
        });
          
        debugLog += `Processed users count: ${processedUsers.length}\n`;
        debugLog += `Processed users: ${JSON.stringify(processedUsers, null, 2)}\n`;
        
        setUsers(processedUsers);
        debugLog += "Users state updated successfully\n";
      } else {
        debugLog += "No profiles found or profileData is not an array\n";
        setUsers([]);
      }
    } catch (err) {
      debugLog += `Exception in fetchUsers: ${JSON.stringify(err, null, 2)}\n`;
      setUsers([]);
    } finally {
      setIsLoading(false);
      setDebugInfo(debugLog);
      debugLog += "fetchUsers completed\n";
      console.log('[AddClient] Complete debug log:', debugLog);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchUsers();
      setSelectedUserId("");
    } else {
      reset();
      setSelectedUserId("");
    }
    onOpenChange(newOpen);
  };

  const handleUserSelect = (value: string) => {
    console.log('[AddClient] User selected:', value);
    setSelectedUserId(value);
    setValue("agent_id", value === "none" ? null : value);
  };

  const onSubmit = async (data: AddClientInfoData) => {
    setIsSubmitting(true);
    try {
      const cleanedData = {
        ...data,
        agent_id: selectedUserId === "none" || selectedUserId === "" ? null : selectedUserId
      };
      
      await onAddClientInfo(cleanedData);
      reset();
      setSelectedUserId("");
      onOpenChange(false);
    } catch (err) {
      console.error('Error adding client info:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log('[AddClient] Component render - users.length:', users.length, 'isLoading:', isLoading);
  console.log('[AddClient] Current users state:', users);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Enhanced Debug section */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <strong>Debug Info:</strong><br/>
            Users found: {users.length}<br/>
            Loading: {isLoading ? 'Yes' : 'No'}<br/>
            Selected User ID: {selectedUserId || 'None'}<br/>
            Dialog Open: {open ? 'Yes' : 'No'}<br/>
            <details className="mt-2">
              <summary>Full Debug Log</summary>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{debugInfo}</pre>
            </details>
            <details className="mt-2">
              <summary>Users Array</summary>
              <pre className="text-xs mt-1">{JSON.stringify(users, null, 2)}</pre>
            </details>
          </div>

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
            <div className="space-y-2">
              <div className="text-xs text-gray-500">
                Debug: {users.length} users available, loading: {isLoading ? 'true' : 'false'}
              </div>
              <Select value={selectedUserId} onValueChange={handleUserSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading users..." : "Select a user"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {users.length > 0 ? (
                    users.map((user) => {
                      console.log('[AddClient] Rendering user option:', user);
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email || `User ${user.id.slice(0, 8)}`}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-users" disabled>
                      {isLoading ? 'Loading...' : 'No users found'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
