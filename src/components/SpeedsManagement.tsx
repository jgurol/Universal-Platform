
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddSpeedDialog } from "./AddSpeedDialog";
import { EditSpeedDialog } from "./EditSpeedDialog";
import { useSpeeds } from "@/hooks/useSpeeds";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SpeedsManagement = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<any>(null);
  
  const { speeds, loading, refetchSpeeds } = useSpeeds();
  const { toast } = useToast();

  const handleEdit = (speed: any) => {
    setSelectedSpeed(speed);
    setEditDialogOpen(true);
  };

  const handleDelete = async (speedId: string) => {
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
                      <Badge variant={speed.is_active ? "default" : "secondary"}>
                        {speed.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(speed)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(speed.id)}
                          className="text-red-600 hover:text-red-700"
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
