
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealRegistration } from "@/services/dealRegistrationService";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, File, Download } from "lucide-react";

interface DealNote {
  id: string;
  content: string;
  created_at: string;
  user_full_name?: string;
}

interface DealDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

interface DealDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string | null;
}

export const DealDetailsDialog = ({ open, onOpenChange, dealId }: DealDetailsDialogProps) => {
  const [deal, setDeal] = useState<DealRegistration | null>(null);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDealData = async () => {
      if (!dealId || !open) {
        setDeal(null);
        setNotes([]);
        setDocuments([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch deal details
        const { data: dealData, error: dealError } = await supabase
          .from('deal_registrations')
          .select('*')
          .eq('id', dealId)
          .single();

        if (dealError) {
          console.error('Error fetching deal:', dealError);
          toast({
            title: "Error",
            description: "Failed to load deal details",
            variant: "destructive"
          });
        } else {
          setDeal(dealData);
        }

        // Fetch notes with user information
        const { data: notesData, error: notesError } = await supabase
          .from('deal_registration_notes')
          .select('*')
          .eq('deal_registration_id', dealId)
          .order('created_at', { ascending: false });

        if (notesError) {
          console.error('Error fetching notes:', notesError);
        } else {
          // Get user info for each note
          const notesWithUsers: DealNote[] = [];
          for (const note of notesData || []) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', note.user_id)
              .single();
            
            notesWithUsers.push({
              id: note.id,
              content: note.content,
              created_at: note.created_at,
              user_full_name: profile?.full_name || 'Unknown User'
            });
          }
          setNotes(notesWithUsers);
        }

        // Fetch documents
        const { data: documentsData, error: documentsError } = await supabase
          .from('deal_registration_documents')
          .select('*')
          .eq('deal_registration_id', dealId)
          .order('created_at', { ascending: false });

        if (documentsError) {
          console.error('Error fetching documents:', documentsError);
        } else {
          setDocuments(documentsData || []);
        }

      } catch (error) {
        console.error('Error fetching deal data:', error);
        toast({
          title: "Error",
          description: "Failed to load deal details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDealData();
  }, [dealId, open, toast]);

  const downloadFile = async (document: DealDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('deal-registration-files')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!deal && !loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deal Details</DialogTitle>
            <DialogDescription>
              Deal information not found
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deal Details</DialogTitle>
          <DialogDescription>
            Information about the associated deal registration
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : deal ? (
          <div className="space-y-6">
            {/* Deal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800">Deal Information</Badge>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Deal Name</Label>
                  <p className="text-sm font-medium">{deal.deal_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Deal Value</Label>
                  <p className="text-sm font-medium">${deal.deal_value.toLocaleString()}</p>
                </div>
              </div>
              
              {deal.expected_close_date && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Expected Close Date</Label>
                  <p className="text-sm">{new Date(deal.expected_close_date).toLocaleDateString()}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <p className="text-sm capitalize">{deal.status}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p className="text-sm">{new Date(deal.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>Notes</span>
                <Badge variant="outline" className="ml-2">{notes.length}</Badge>
              </h3>
              
              {notes.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notes.map((note) => (
                    <Card key={note.id} className="border border-gray-200">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {note.user_full_name}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No notes available</p>
              )}
            </div>

            {/* Documents Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <File className="w-5 h-5 text-green-600" />
                <span>Documents</span>
                <Badge variant="outline" className="ml-2">{documents.length}</Badge>
              </h3>
              
              {documents.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(doc)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No documents available</p>
              )}
            </div>
          </div>
        ) : null}
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
