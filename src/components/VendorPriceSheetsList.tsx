import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Download, Trash2, Upload, Calendar, HardDrive } from "lucide-react";
import { useVendorPriceSheets } from "@/hooks/useVendorPriceSheets";
import { UploadPriceSheetDialog } from "@/components/UploadPriceSheetDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVendors } from "@/hooks/useVendors";

interface VendorPriceSheetsListProps {
  vendorId?: string;
  vendorName?: string;
}

export const VendorPriceSheetsList = ({ vendorId, vendorName }: VendorPriceSheetsListProps) => {
  const { priceSheets, isLoading, uploadPriceSheet, deletePriceSheet } = useVendorPriceSheets();
  const { vendors } = useVendors();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filter price sheets by vendorId if provided
  const filteredPriceSheets = vendorId 
    ? priceSheets.filter(sheet => sheet.vendor_id === vendorId)
    : priceSheets;

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown size";
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (priceSheet: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('vendor-price-sheets')
        .createSignedUrl(priceSheet.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        toast({
          title: "Download failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Open in popup window
      const popup = window.open(
        data.signedUrl, 
        'priceSheet',
        'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
      );
      
      if (!popup) {
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site to view price sheets",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Opening price sheet",
          description: `${priceSheet.name} is opening in a popup window.`
        });
      }
    } catch (error) {
      console.error('Error opening price sheet:', error);
      toast({
        title: "Download failed",
        description: "Failed to open the price sheet",
        variant: "destructive"
      });
    }
  };

  const handleUpload = async (file: File, name: string, selectedVendorId?: string) => {
    try {
      await uploadPriceSheet(file, name, selectedVendorId || vendorId);
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePriceSheet(id);
      toast({
        title: "Success",
        description: "Price sheet deleted successfully"
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Error",
        description: "Failed to delete price sheet",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading price sheets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Price Sheets</h3>
          <p className="text-sm text-gray-600">
            {vendorName ? `Price sheets for ${vendorName}` : "All uploaded price sheets"}
          </p>
        </div>
        <Button 
          onClick={() => setIsUploadDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Price Sheet
        </Button>
      </div>

      {filteredPriceSheets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No price sheets uploaded</h3>
            <p className="text-gray-600 mb-4">
              Upload vendor price sheets to keep them organized and easily accessible.
            </p>
            <Button 
              onClick={() => setIsUploadDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload First Price Sheet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPriceSheets.map((priceSheet) => (
            <Card key={priceSheet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium text-gray-900">{priceSheet.name}</h4>
                      {priceSheet.vendor_id && (
                        <Badge variant="outline" className="ml-2">
                          Vendor Sheet
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>File:</strong> {priceSheet.file_name}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-4 w-4" />
                          {formatFileSize(priceSheet.file_size)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(priceSheet.uploaded_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(priceSheet)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Open
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Price Sheet</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{priceSheet.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(priceSheet.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadPriceSheetDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={handleUpload}
        vendors={vendors}
      />
    </div>
  );
};
