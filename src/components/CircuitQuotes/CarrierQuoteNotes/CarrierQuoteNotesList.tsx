
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText, Image, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NoteFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface NoteEntry {
  id: string;
  date: string;
  note: string;
  files: NoteFile[];
}

interface CarrierQuoteNotesListProps {
  notes: NoteEntry[];
  onDeleteNote: (noteId: string) => void;
}

export const CarrierQuoteNotesList = ({
  notes,
  onDeleteNote
}: CarrierQuoteNotesListProps) => {
  const { toast } = useToast();

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
    <div className="space-y-3">
      {notes.length > 0 && (
        <h4 className="font-medium">Previous Notes</h4>
      )}
      
      {notes.map((note) => (
        <Card key={note.id} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">{note.date}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteNote(note.id)}
                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {note.note && (
              <p className="text-sm mb-3 whitespace-pre-wrap">{note.note}</p>
            )}
            
            {note.files.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs font-medium text-gray-600">Attachments:</Label>
                <div className="grid grid-cols-1 gap-3">
                  {note.files.map((file) => (
                    <div key={file.id} className="space-y-2">
                      {file.type.startsWith('image/') ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4" />
                              <span>{file.name}</span>
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
                          <div className="border rounded-lg overflow-hidden bg-gray-50 p-2">
                            <img 
                              src={file.url} 
                              alt={file.name}
                              className="w-full max-w-md h-auto object-contain rounded"
                              style={{ maxHeight: '300px' }}
                              onError={(e) => {
                                console.error('Image failed to load:', file.url);
                                console.error('Error details:', e);
                                // Show broken image placeholder
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'block';
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiIHN0cm9rZT0iIzk5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yMSAxNS0zLjA4Ni0zLjA4NmEyIDIgMCAwIDAtMS4zLjUyOWwtMi40IDE3LjE0M2EyIDIgMCAwIDEtMS4xIC41MzdMMyAxNSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
                                target.alt = 'Failed to load image';
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', file.url);
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{file.name}</span>
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
  );
};
