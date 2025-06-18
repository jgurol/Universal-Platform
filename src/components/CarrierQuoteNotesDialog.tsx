import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText, Image, Upload, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface NoteEntry {
  id: string;
  date: string;
  note: string;
  files: NoteFile[];
}

interface NoteFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface CarrierQuoteNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrierId: string;
  carrierName: string;
  initialNotes?: string;
  onNotesUpdate?: (notes: string) => void;
}

export const CarrierQuoteNotesDialog = ({ 
  open, 
  onOpenChange, 
  carrierId, 
  carrierName, 
  initialNotes = "",
  onNotesUpdate 
}: CarrierQuoteNotesDialogProps) => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [newNote, setNewNote] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing notes when dialog opens
  useEffect(() => {
    if (open && carrierId) {
      loadNotes();
    }
  }, [open, carrierId]);

  // Initialize with existing notes if they exist
  useEffect(() => {
    if (open && initialNotes && notes.length === 0) {
      // Convert existing notes to first entry if no structured notes exist
      const initialEntry: NoteEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        note: initialNotes,
        files: []
      };
      setNotes([initialEntry]);
    }
  }, [open, initialNotes, notes.length]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('carrier_quote_notes')
        .select(`
          *,
          carrier_quote_note_files (*)
        `)
        .eq('carrier_quote_id', carrierId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotes: NoteEntry[] = (data || []).map(note => ({
        id: note.id,
        date: new Date(note.created_at).toISOString().split('T')[0],
        note: note.content,
        files: (note.carrier_quote_note_files || []).map((file: any) => ({
          id: file.id,
          name: file.name,
          type: file.file_type,
          url: file.file_path,
          size: file.file_size || 0
        }))
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadingFiles(prev => [...prev, ...files]);
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<NoteFile | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `carrier-quote-notes/${carrierId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('carrier-quote-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('carrier-quote-files')
        .getPublicUrl(filePath);

      return {
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        name: file.name,
        type: file.type,
        url: urlData.publicUrl,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}`,
        variant: "destructive"
      });
      return null;
    }
  };

  const saveNote = async () => {
    if (!newNote.trim() && uploadingFiles.length === 0) {
      return;
    }

    setLoading(true);
    try {
      // Upload files first
      const uploadedFiles: NoteFile[] = [];
      for (const file of uploadingFiles) {
        const uploadedFile = await uploadFile(file);
        if (uploadedFile) {
          uploadedFiles.push(uploadedFile);
        }
      }

      // Save note to database
      const { data: noteData, error: noteError } = await supabase
        .from('carrier_quote_notes')
        .insert({
          carrier_quote_id: carrierId,
          content: newNote.trim(),
          user_id: user?.id
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Save file references
      if (uploadedFiles.length > 0) {
        const fileInserts = uploadedFiles.map(file => ({
          carrier_quote_note_id: noteData.id,
          file_name: file.name,
          file_type: file.type,
          file_path: file.url,
          file_size: file.size
        }));

        const { error: filesError } = await supabase
          .from('carrier_quote_note_files')
          .insert(fileInserts);

        if (filesError) throw filesError;
      }

      // Add to local state
      const newEntry: NoteEntry = {
        id: noteData.id,
        date: new Date().toISOString().split('T')[0],
        note: newNote.trim(),
        files: uploadedFiles
      };

      setNotes(prev => [newEntry, ...prev]);
      setNewNote("");
      setUploadingFiles([]);

      toast({
        title: "Note saved",
        description: "Your note has been saved successfully"
      });

      // Update the carrier quote's notes field with a summary
      const allNotesText = [newEntry, ...notes]
        .map(note => `${note.date}: ${note.note}`)
        .join('\n\n');
      
      if (onNotesUpdate) {
        onNotesUpdate(allNotesText);
      }

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

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('carrier_quote_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      
      toast({
        title: "Note deleted",
        description: "Note has been deleted successfully"
      });

      // Update summary
      const remainingNotes = notes.filter(note => note.id !== noteId);
      const allNotesText = remainingNotes
        .map(note => `${note.date}: ${note.note}`)
        .join('\n\n');
      
      if (onNotesUpdate) {
        onNotesUpdate(allNotesText);
      }

    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  const downloadFile = async (file: NoteFile) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Failed to download file",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notes for {carrierName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new note section */}
          <Card>
            <CardHeader className="pb-3">
              <h4 className="font-medium">Add New Note</h4>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-note">Note</Label>
                <Textarea
                  id="new-note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note here..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="file-upload">Attach Files</Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </div>

              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Files to upload:</Label>
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{file.name} ({formatFileSize(file.size)})</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                onClick={saveNote} 
                disabled={loading || (!newNote.trim() && uploadingFiles.length === 0)}
                className="w-full"
              >
                {loading ? "Saving..." : "Save Note"}
              </Button>
            </CardContent>
          </Card>

          {/* Existing notes - with tighter spacing */}
          <div className="space-y-2">
            {notes.length > 0 && (
              <h4 className="font-medium">Previous Notes</h4>
            )}
            
            {notes.map((note) => (
              <Card key={note.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">{note.date}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {note.note && (
                    <p className="text-sm mb-2 whitespace-pre-wrap">{note.note}</p>
                  )}
                  
                  {note.files.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Attachments:</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {note.files.map((file) => (
                          <div key={file.id} className="space-y-2">
                            {file.type.startsWith('image/') ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    <Image className="h-4 w-4" />
                                    <span className="text-sm">{file.name}</span>
                                    <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadFile(file)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                  <img 
                                    src={file.url} 
                                    alt={file.name}
                                    className="w-full max-w-md h-auto object-contain"
                                    style={{ maxHeight: '300px' }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadFile(file)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {notes.length === 0 && (
              <div className="text-center text-gray-500 py-6">
                No notes yet. Add your first note above.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
