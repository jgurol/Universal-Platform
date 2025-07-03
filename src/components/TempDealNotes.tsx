import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Trash2, Edit, Save, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TempNote {
  id: string;
  content: string;
  timestamp: string;
  userName: string;
}

interface TempDealNotesProps {
  notes: TempNote[];
  onNotesChange: (notes: TempNote[]) => void;
  disabled?: boolean;
}

export const TempDealNotes = ({ notes, onNotesChange, disabled = false }: TempDealNotesProps) => {
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const { user } = useAuth();

  const addNote = () => {
    if (!user || !newNote.trim()) return;

    const tempNote: TempNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      timestamp: new Date().toISOString(),
      userName: user.user_metadata?.full_name || 'Unknown User'
    };

    onNotesChange([tempNote, ...notes]);
    setNewNote("");
  };

  const updateNote = (id: string) => {
    if (!editContent.trim()) return;

    const updatedNotes = notes.map(note =>
      note.id === id 
        ? { ...note, content: editContent.trim(), timestamp: new Date().toISOString() }
        : note
    );
    
    onNotesChange(updatedNotes);
    setEditingId(null);
    setEditContent("");
  };

  const deleteNote = (id: string) => {
    onNotesChange(notes.filter(note => note.id !== id));
  };

  const startEdit = (note: TempNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
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
          Notes {disabled && <span className="text-sm text-gray-500">(Create deal to save notes)</span>}
        </Label>
        
        {/* Add new note */}
        <div className="mt-2 space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            disabled={disabled}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={addNote}
              disabled={!newNote.trim() || disabled}
              size="sm"
            >
              Add Note
            </Button>
          </div>
        </div>

        {/* Notes list */}
        {notes.length > 0 ? (
          <div className="space-y-3 mt-4 max-h-60 overflow-y-auto">
            {notes.map((note) => (
              <Card key={note.id} className="border border-gray-200">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {note.userName}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(note.timestamp)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(note)}
                        className="h-6 w-6 p-0"
                        disabled={disabled}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        disabled={disabled}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        disabled={disabled}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => updateNote(note.id)}
                          disabled={!editContent.trim() || disabled}
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
        ) : (
          <div className="text-sm text-gray-500 mt-4">No notes added yet</div>
        )}
      </div>
    </div>
  );
};