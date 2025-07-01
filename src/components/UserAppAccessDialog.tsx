
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAppAccess } from "@/hooks/useAppAccess";

interface UserProfile {  
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface UserAppAccessDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserAppAccessDialog = ({ user, open, onOpenChange }: UserAppAccessDialogProps) => {
  const { toast } = useToast();
  const { allApps, getUserAppAccess, updateUserAppAccess } = useAppAccess();
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAccess, setFetchingAccess] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchUserAccess();
    }
  }, [user, open]);

  const fetchUserAccess = async () => {
    if (!user) return;
    
    setFetchingAccess(true);
    try {
      const accessAppIds = await getUserAppAccess(user.id);
      setSelectedAppIds(accessAppIds);
    } catch (error) {
      console.error('Error fetching user access:', error);
    } finally {
      setFetchingAccess(false);
    }
  };

  const handleAppToggle = (appId: string, checked: boolean) => {
    if (checked) {
      setSelectedAppIds(prev => [...prev, appId]);
    } else {
      setSelectedAppIds(prev => prev.filter(id => id !== appId));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const success = await updateUserAppAccess(user.id, selectedAppIds);
      
      if (success) {
        toast({
          title: "Success",
          description: `App access updated for ${user.full_name || user.email}`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update app access",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating app access:', error);
      toast({
        title: "Error",
        description: "Failed to update app access",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage App Access</DialogTitle>
          <DialogDescription>
            Control which applications {user.full_name || user.email} can access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fetchingAccess ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading current access...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allApps.map((app) => (
                <div key={app.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={app.id}
                    checked={selectedAppIds.includes(app.id)}
                    onCheckedChange={(checked) => handleAppToggle(app.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={app.id} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {app.name}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {app.description}
                    </p>
                  </div>
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: app.color }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={loading || fetchingAccess}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
