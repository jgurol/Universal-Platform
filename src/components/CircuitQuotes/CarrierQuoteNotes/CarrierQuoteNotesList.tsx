
import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2, Calendar, User, Image } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
  user_name: string;
}

interface CarrierQuoteNotesListProps {
  notes: NoteEntry[];
  onDeleteNote: (noteId: string) => void;
}

export const CarrierQuoteNotesList = ({ notes, onDeleteNote }: CarrierQuoteNotesListProps) => {
  const { isAdmin } = useAuth();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string) => {
    console.log('Original date string:', dateString);
    
    try {
      // Parse the datetime string directly
      const date = new Date(dateString);
      console.log('Parsed datetime:', date);
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      // Format the full datetime with time
      const formatted = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      console.log('Formatted datetime:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 border rounded-lg bg-blue-50">
        <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
        <p className="font-medium">No notes yet</p>
        <p className="text-sm">Add your first note above</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Previous Notes</h3>
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
                <span>{formatDateTime(note.date)}</span>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteNote(note.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <p className="text-gray-900 mb-3">{note.note}</p>
          
          {note.files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Attachments:</h4>
              <div className="grid gap-2">
                {note.files.map((file) => (
                  <div key={file.id} className="bg-gray-50 p-2 rounded">
                    {isImageFile(file.type) ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="max-w-full h-auto max-h-48 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(file.url, '_blank')}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
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
  );
};
