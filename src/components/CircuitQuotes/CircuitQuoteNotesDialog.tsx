
import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, Trash2, Calendar, User, Image, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CircuitQuoteNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circuitQuoteId: string;
  clientName: string;
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

export const CircuitQuoteNotesDialog = ({ 
  open, 
  onOpenChange, 
  circuitQuoteId, 
  clientName 
}: CircuitQuoteNotesDialogProps) => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [newNote, setNewNote] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load notes when dialog opens
  useEffect(() => {
    if (open && circuitQuoteId) {
      loadNotes();
    }
  }, [open, circuitQuoteId]);

  const loadNotes = async () => {
    try {
      setLoadingNotes(true);
      
      const { data: notesData, error } = await supabase
        .from('circuit_quote_notes')
        .select(`
          *,
          circuit_quote_note_files (*)
        `)
        .eq('circuit_quote_id', circuitQuoteId)
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
      setLoadingNotes(false);
    }
  };

  const addFiles = (files: File[]) => {
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB and will be skipped`,
          variant: "destructive"
        });
        return false;
      }
      
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type and will be skipped`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setUploadingFiles([...uploadingFiles, ...validFiles]);
      
      if (validFiles.length < files.length) {
        toast({
          title: "Some files skipped",
          description: `${validFiles.length} of ${files.length} files added`,
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const uploadFile = async (file: File, noteId: string): Promise<NoteFile | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `circuit-quote-notes/${circuitQuoteId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('circuit-quote-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('circuit-quote-files')
        .getPublicUrl(filePath);

      const { data: fileData, error: fileError } = await supabase
        .from('circuit_quote_note_files')
        .insert({
          circuit_quote_note_id: noteId,
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
      const { data: noteData, error: noteError } = await supabase
        .from('circuit_quote_notes')
        .insert({
          circuit_quote_id: circuitQuoteId,
          content: newNote.trim() || "File upload",
          user_id: user?.id
        })
        .select()
        .single();

      if (noteError) {
        console.error('Note error:', noteError);
        throw noteError;
      }

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

      setNewNote("");
      setUploadingFiles([]);
      
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
        .from('circuit_quote_notes')
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
        .from('circuit_quote_note_files')
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
    addFiles(files);
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] max-w-2xl ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b">
          <DrawerTitle>Notes - {clientName}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

            {/* Drag and Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer mb-3 ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span className="font-medium">Click to upload</span> or drag and drop files here
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Images, PDFs, documents up to 10MB
              </p>
            </div>

            <Input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />

            {uploadingFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                <Label>Files to upload ({uploadingFiles.length}):</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(index)}
                        className="ml-2 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={saveNote}
                disabled={(!newNote.trim() && uploadingFiles.length === 0) || loading}
                className="bg-purple-600 hover:bg-purple-700"
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
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border rounded-lg bg-blue-50">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
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
      </DrawerContent>
    </Drawer>
  );
};
