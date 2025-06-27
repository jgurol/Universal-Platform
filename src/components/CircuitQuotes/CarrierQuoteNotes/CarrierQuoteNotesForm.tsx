
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CarrierQuoteNotesFormProps {
  newNote: string;
  setNewNote: (note: string) => void;
  uploadingFiles: File[];
  setUploadingFiles: (files: File[]) => void;
  loading: boolean;
  onSaveNote: () => void;
}

export const CarrierQuoteNotesForm = ({
  newNote,
  setNewNote,
  uploadingFiles,
  setUploadingFiles,
  loading,
  onSaveNote
}: CarrierQuoteNotesFormProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
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

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(uploadingFiles.filter((_, i) => i !== index));
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
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

        {/* Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
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
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />

        {uploadingFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Files to upload ({uploadingFiles.length}):</Label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {uploadingFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
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

        <Button 
          onClick={onSaveNote} 
          disabled={loading || (!newNote.trim() && uploadingFiles.length === 0)}
          className="w-full"
        >
          {loading ? "Saving..." : "Save Note"}
        </Button>
      </CardContent>
    </Card>
  );
};
