import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Image, X, Download, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface NoteEntry {
  id: string;
  content: string;
  created_at: string;
  user_name: string;
  files: NoteFile[];
}

interface NoteFile {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
}

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
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [newNote, setNewNote] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && circuitQuoteId) {
      loadNotes();
    }
  }, [open, circuitQuoteId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      const { data: notesData, error } = await supabase
        .from('circuit_quote_notes')
        .select(`
          *,
          circuit_quote_note_files (*),
          profiles!circuit_quote_notes_user_id_fkey (full_name, email)
        `)
        .eq('circuit_quote_id', circuitQuoteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotes: NoteEntry[] = (notesData || []).map(note => ({
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        user_name: (note.profiles as any)?.full_name || (note.profiles as any)?.email || 'Unknown User',
        files: (note.circuit_quote_note_files || []).map((file: any) => ({
          id: file.id,
          file_name: file.file_name,
          file_type: file.file_type,
          file_path: file.file_path,
          file_size: file.file_size || 0
        }))
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${circuitQuoteId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('circuit-quote-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('circuit-quote-files')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const saveNote = async () => {
    if (!newNote.trim() && selectedFiles.length === 0) return;
    if (!user) return;

    try {
      setUploading(true);

      // Create the note
      const { data: noteData, error: noteError } = await supabase
        .from('circuit_quote_notes')
        .insert({
          circuit_quote_id: circuitQuoteId,
          user_id: user.id,
          content: newNote.trim()
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Upload files if any
      const uploadedFiles: NoteFile[] = [];
      for (const file of selectedFiles) {
        const filePath = await uploadFile(file);
        if (filePath) {
          const { data: fileData, error: fileError } = await supabase
            .from('circuit_quote_note_files')
            .insert({
              circuit_quote_note_id: noteData.id,
              file_name: file.name,
              file_type: file.type,
              file_path: filePath,
              file_size: file.size
            })
            .select()
            .single();

          if (!fileError && fileData) {
            uploadedFiles.push({
              id: fileData.id,
              file_name: fileData.file_name,
              file_type: fileData.file_type,
              file_path: fileData.file_path,
              file_size: fileData.file_size || 0
            });
          }
        }
      }

      // Get user info for display
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      // Add to local state
      const newEntry: NoteEntry = {
        id: noteData.id,
        content: noteData.content,
        created_at: noteData.created_at,
        user_name: userProfile?.full_name || userProfile?.email || 'Unknown User',
        files: uploadedFiles
      };

      setNotes(prev => [newEntry, ...prev]);
      setNewNote("");
      setSelectedFiles([]);

      toast({
        title: "Success",
        description: "Note saved successfully"
      });

    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const downloadFile = (file: NoteFile) => {
    window.open(file.file_path, '_blank');
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('circuit_quote_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      
      toast({
        title: "Success",
        description: "Note deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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
            
            {/* File Upload */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Attach Files
                </Button>
                <span className="text-sm text-gray-500">
                  Images, PDFs, Documents supported
                </span>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Files:</Label>
                  <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex items-center gap-2">
                          {isImage(file.type) ? (
                            <Image className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                onClick={saveNote}
                disabled={(!newNote.trim() && selectedFiles.length === 0) || uploading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {uploading ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>

          {/* Existing Notes */}
          <div className="space-y-4">
            <Label className="text-lg font-medium">Previous Notes</Label>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No notes yet. Add the first note above.
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{note.user_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(note.created_at), 'MMM dd, yyyy at h:mm a')}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="prose prose-sm max-w-none mb-3">
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    </div>

                    {/* Attached Files */}
                    {note.files.length > 0 && (
                      <div className="border-t pt-3">
                        <Label className="text-sm font-medium mb-2 block">Attachments:</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {note.files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded border cursor-pointer hover:bg-gray-100"
                              onClick={() => downloadFile(file)}
                            >
                              <div className="flex items-center gap-2">
                                {isImage(file.file_type) ? (
                                  <Image className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <FileText className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-sm truncate">{file.file_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(file.file_size)}
                                </span>
                                <Download className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
