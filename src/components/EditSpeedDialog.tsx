
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Speed } from "@/hooks/useSpeeds";

interface EditSpeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  speed: Speed;
  onSuccess: () => void;
}

export const EditSpeedDialog = ({ open, onOpenChange, speed, onSuccess }: EditSpeedDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (speed) {
      setName(speed.name);
      setDescription(speed.description || "");
      setIsActive(speed.is_active);
    }
  }, [speed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('speeds')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          is_active: isActive
        })
        .eq('id', speed.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Speed option updated successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating speed:', error);
      toast({
        title: "Error",
        description: "Failed to update speed option",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Speed Option</DialogTitle>
          <DialogDescription>
            Update the speed option details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name (Required)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 100x100M, 1Gx1G"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 100 Mbps upload/download"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="active">Active</Label>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading || !name.trim()}
            >
              {loading ? "Updating..." : "Update Speed Option"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
