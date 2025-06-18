
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NoteFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

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
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadingFiles([...uploadingFiles, ...files]);
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(uploadingFiles.filter((_, i) => i !== index));
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
