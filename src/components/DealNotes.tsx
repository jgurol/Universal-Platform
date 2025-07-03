import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Trash2, Edit, Save, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DealNote {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_full_name?: string;
}

interface DealNotesProps {
  dealId?: string;
  onNotesChange?: (notes: DealNote[]) => void;
}

export const DealNotes = ({ dealId, onNotesChange }: DealNotesProps) => {
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load notes
  const loadNotes = async () => {
    if (!dealId) return;
    
    setLoading(true);
    try {
      const { data: notesData, error } = await supabase
        .from('deal_registration_notes')
        .select('*')
        .eq('deal_registration_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get user info for each note
      const notesWithUsers: DealNote[] = [];
      for (const note of notesData || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', note.user_id)
          .single();
        
        notesWithUsers.push({
          ...note,
          user_full_name: profile?.full_name || 'Unknown User'
        });
      }
      
      setNotes(notesWithUsers);
      onNotesChange?.(notesWithUsers);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Failed to load notes",
        description: "There was an error loading the notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealId) {
      loadNotes();
    }
  }, [dealId]);

  const addNote = async () => {
    if (!user || !dealId || !newNote.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('deal_registration_notes')
        .insert({
          deal_registration_id: dealId,
          user_id: user.id,
          content: newNote.trim()
        });

      if (error) throw error;

      setNewNote("");
      await loadNotes();
      
      toast({
        title: "Note added",
        description: "Your note has been added successfully"
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Failed to add note",
        description: "There was an error adding your note",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('deal_registration_notes')
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      if (error) throw error;

      setEditingNote(null);
      setEditContent("");
      await loadNotes();
      
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Failed to update note",
        description: "There was an error updating your note",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error } = await supabase
        .from('deal_registration_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      await loadNotes();
      
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Failed to delete note",
        description: "There was an error deleting your note",
        variant: "destructive"
      });
    }
  };

  const startEdit = (note: DealNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditContent("");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Notes
        </Label>
        
        {/* Add new note */}
        <div className="mt-2 space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            disabled={!dealId}
          />
          <div className="flex justify-end">
            <Button
              onClick={addNote}
              disabled={submitting || !newNote.trim() || !dealId}
              size="sm"
            >
              {submitting ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
          {!dealId && (
            <span className="text-sm text-gray-500">Save deal first to add notes</span>
          )}
        </div>

        {/* Notes list */}
        {loading ? (
          <div className="text-sm text-gray-500 mt-4">Loading notes...</div>
        ) : notes.length > 0 ? (
          <div className="space-y-3 mt-4 max-h-60 overflow-y-auto">
            {notes.map((note) => (
              <Card key={note.id} className="border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {note.user_full_name || 'Unknown User'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(note.created_at)}
                      </span>
                      {note.updated_at !== note.created_at && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                    {user?.id === note.user_id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(note)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {editingNote === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateNote(note.id)}
                          disabled={!editContent.trim()}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dealId ? (
          <div className="text-sm text-gray-500 mt-4">No notes added yet</div>
        ) : null}
      </div>
    </div>
  );
};