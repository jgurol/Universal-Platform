
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, Trash2, Calendar, User, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface DealNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  dealName: string;
}

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

export const DealNotesDialog = ({ 
  open, 
  onOpenChange, 
  dealId, 
  dealName 
}: DealNotesDialogProps) => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [newNote, setNewNote] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load notes when dialog opens
  useEffect(() => {
    if (open && dealId) {
      loadNotes();
    }
  }, [open, dealId]);

  const loadNotes = async () => {
    try {
      setLoadingNotes(true);
      
      // Fetch notes with user profile information and files
      const { data: notesData, error } = await supabase
        .from('deal_registration_notes')
        .select(`
          *,
          deal_registration_note_files (*)
        `)
        .eq('deal_registration_id', dealId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notes:', error);
        toast({
          title: "Error",
          description: "Failed to load notes",
          variant: "destructive"
        });
        return;
      }

      // Get user profiles for the notes
      const userIds = [...new Set(notesData?.map(note => note.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);

      const formattedNotes: NoteEntry[] = (notesData || []).map(note => ({
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        user_name: profilesMap.get(note.user_id) || 'Unknown User',
        files: (note.deal_registration_note_files || []).map((file: any) => ({
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
      setLoadingNotes(false);
    }
  };

  const uploadFile = async (file: File, noteId: string): Promise<NoteFile | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `deal-notes/${dealId}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deal-registration-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('deal-registration-files')
        .getPublicUrl(filePath);

      // Save file reference to database
      const { data: fileData, error: fileError } = await supabase
        .from('deal_registration_note_files')
        .insert({
          deal_registration_note_id: noteId,
          file_name: file.name,
          file_type: file.type,
          file_path: urlData.publicUrl,
          file_size: file.size
        })
        .select()
        .single();

      if (fileError) {
        console.error('File record error:', fileError);
        throw fileError;
      }

      return {
        id: fileData.id,
        file_name: file.name,
        file_type: file.type,
        file_path: urlData.publicUrl,
        file_size: file.size
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
      toast({
        title: "Error",
        description: "Please enter a note or select files to upload",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Save note to database
      const { data: noteData, error: noteError } = await supabase
        .from('deal_registration_notes')
        .insert({
          deal_registration_id: dealId,
          content: newNote.trim() || "File upload",
          user_id: user?.id
        })
        .select()
        .single();

      if (noteError) {
        console.error('Note error:', noteError);
        throw noteError;
      }

      // Upload files if any
      const uploadedFiles: NoteFile[] = [];
      for (const file of uploadingFiles) {
        const uploadedFile = await uploadFile(file, noteData.id);
        if (uploadedFile) {
          uploadedFiles.push(uploadedFile);
        }
      }

      toast({
        title: "Success",
        description: "Note saved successfully"
      });

      // Reset form
      setNewNote("");
      setUploadingFiles([]);
      
      // Reload notes
      await loadNotes();

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
        .from('deal_registration_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully"
      });

      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('deal_registration_note_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File deleted successfully"
      });

      await loadNotes();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadingFiles(prev => [...prev, ...files]);
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notes - {dealName}</DialogTitle>
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

            {/* File Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Attach Files
                </Button>
                <span className="text-sm text-gray-500">
                  {uploadingFiles.length > 0 && `${uploadingFiles.length} file(s) selected`}
                </span>
              </div>

              {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
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
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                onClick={saveNote}
                disabled={(!newNote.trim() && uploadingFiles.length === 0) || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Previous Notes</h3>
            
            {loadingNotes ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg bg-green-50">
                <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">No notes yet</p>
                <p className="text-sm">Add your first note above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{note.user_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(note.created_at)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <p className="text-gray-900 mb-3">{note.content}</p>
                    
                    {note.files.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Attachments:</h4>
                        <div className="grid gap-2">
                          {note.files.map((file) => (
                            <div key={file.id} className="bg-gray-50 p-2 rounded">
                              {isImageFile(file.file_type) ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Image className="h-4 w-4" />
                                      <span className="text-sm">{file.file_name}</span>
                                      <span className="text-xs text-gray-500">({formatFileSize(file.file_size)})</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(file.file_path, '_blank')}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteFile(file.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <img 
                                      src={file.file_path} 
                                      alt={file.file_name}
                                      className="max-w-full h-auto max-h-48 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => window.open(file.file_path, '_blank')}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-sm">{file.file_name}</span>
                                    <span className="text-xs text-gray-500">({formatFileSize(file.file_size)})</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(file.file_path, '_blank')}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteFile(file.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
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
