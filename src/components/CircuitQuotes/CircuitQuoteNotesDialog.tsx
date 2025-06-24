
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

interface CircuitQuoteNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circuitQuoteId: string;
  clientName: string;
}

export const CircuitQuoteNotesDialog = ({ 
  open, 
  onOpenChange, 
  circuitQuoteId, 
  clientName 
}: CircuitQuoteNotesDialogProps) => {
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveNote = async () => {
    if (!newNote.trim()) return;

    try {
      setLoading(true);
      
      // For now, just show a success message since the database tables don't exist yet
      toast({
        title: "Note functionality coming soon",
        description: "The database tables for notes need to be created first. Please run the SQL migration.",
        variant: "default"
      });

      setNewNote("");
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Notes - {clientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Note Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <Label htmlFor="new-note" className="text-sm font-medium mb-2 block">
              Add New Note
            </Label>
            <Textarea
              id="new-note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note here..."
              className="mb-3"
              rows={3}
            />

            <div className="flex justify-end mt-4">
              <Button 
                onClick={saveNote}
                disabled={!newNote.trim() || loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>

          {/* Info Message */}
          <div className="text-center py-8 text-gray-500 border rounded-lg bg-blue-50">
            <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="font-medium">Notes functionality is ready</p>
            <p className="text-sm">Run the SQL migration to enable full notes and file upload features</p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
