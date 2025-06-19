
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddSpeedDialog } from "./AddSpeedDialog";
import { EditSpeedDialog } from "./EditSpeedDialog";
import { useSpeeds } from "@/hooks/useSpeeds";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export const SpeedsManagement = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<any>(null);
  
  const { speeds, loading, refetchSpeeds } = useSpeeds();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const handleEdit = (speed: any) => {
    setSelectedSpeed(speed);
    setEditDialogOpen(true);
  };

  const handleDuplicate = async (speed: any) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('speeds')
        .insert({
          name: `${speed.name} (Copy)`,
          description: speed.description,
          is_active: speed.is_active,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Speed option duplicated successfully",
      });
      
      refetchSpeeds();
    } catch (error) {
      console.error('Error duplicating speed:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate speed option",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (speedId: string, speedUserId: string) => {
    // Only allow deletion if user owns the speed or is admin
    if (!isAdmin && speedUserId !== user?.id) {
      toast({
        title: "Error",
        description: "You can only delete speed options you created",
        variant: "destructive"
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this speed option?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('speeds')
        .delete()
        .eq('id', speedId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Speed option deleted successfully",
      });
      
      refetchSpeeds();
    } catch (error) {
      console.error('Error deleting speed:', error);
      toast({
        title: "Error",
        description: "Failed to delete speed option",
        variant: "destructive"
      });
    }
  };

  const handleAddSuccess = () => {
    refetchSpeeds();
    setAddDialogOpen(false);
  };

  const handleEditSuccess = () => {
    refetchSpeeds();
    setEditDialogOpen(false);
    setSelectedSpeed(null);
  };

  const isSystemDefault = (userId: string) => {
    return userId === '00000000-0000-0000-0000-000000000000';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Speed Options Management</CardTitle>
              <CardDescription>
                Manage the speed options available when creating carrier quotes
              </CardDescription>
            </div>
            <Button 
              onClick={() => setAddDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Speed Option
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading speeds...</div>
          ) : speeds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No speed options found. Add your first speed option to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {speeds.map((speed) => (
                  <TableRow key={speed.id}>
                    <TableCell className="font-medium">{speed.name}</TableCell>
                    <TableCell>{speed.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={isSystemDefault(speed.user_id) ? "default" : "secondary"}>
                        {isSystemDefault(speed.user_id) ? "System Default" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={speed.is_active ? "default" : "secondary"}>
                        {speed.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(speed)}
                          className="text-green-600 hover:text-green-700"
                          title="Duplicate Speed Option"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(speed)}
                          disabled={isSystemDefault(speed.user_id) && !isAdmin}
                          title={isSystemDefault(speed.user_id) && !isAdmin ? "Cannot edit system defaults" : "Edit Speed Option"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(speed.id, speed.user_id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={isSystemDefault(speed.user_id) && !isAdmin}
                          title={isSystemDefault(speed.user_id) && !isAdmin ? "Cannot delete system defaults" : "Delete Speed Option"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddSpeedDialog 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddSuccess}
      />

      {selectedSpeed && (
        <EditSpeedDialog 
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          speed={selectedSpeed}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};
