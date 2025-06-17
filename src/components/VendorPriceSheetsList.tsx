
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, Upload } from "lucide-react";
import { useVendorPriceSheets } from "@/hooks/useVendorPriceSheets";
import { useVendors } from "@/hooks/useVendors";
import { UploadPriceSheetDialog } from "@/components/UploadPriceSheetDialog";
import { formatDistanceToNow } from "date-fns";

export const VendorPriceSheetsList = () => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { priceSheets, isLoading, uploadPriceSheet, deletePriceSheet, downloadPriceSheet } = useVendorPriceSheets();
  const { vendors } = useVendors();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getVendorName = (vendorId?: string) => {
    if (!vendorId) return null;
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.name;
  };

  const getVendorColor = (vendorId?: string) => {
    if (!vendorId) return '#6B7280';
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.color || '#6B7280';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading price sheets...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle>Price Sheets</CardTitle>
              <Badge variant="outline" className="ml-2">
                {priceSheets.length} files
              </Badge>
            </div>
            <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload Price Sheet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {priceSheets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No price sheets yet</p>
              <p className="text-sm mb-4">Upload vendor price sheets for easy reference</p>
              <Button onClick={() => setIsUploadDialogOpen(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Price Sheet
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {priceSheets.map((priceSheet) => {
                const vendorName = getVendorName(priceSheet.vendor_id);
                const vendorColor = getVendorColor(priceSheet.vendor_id);
                
                return (
                  <div key={priceSheet.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{priceSheet.name}</h4>
                          {vendorName && (
                            <Badge 
                              variant="outline" 
                              className="text-xs text-white border-0"
                              style={{ backgroundColor: vendorColor }}
                            >
                              {vendorName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{priceSheet.file_name}</span>
                          <span>{formatFileSize(priceSheet.file_size)}</span>
                          <span>Uploaded {formatDistanceToNow(new Date(priceSheet.uploaded_at))} ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => downloadPriceSheet(priceSheet)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deletePriceSheet(priceSheet.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadPriceSheetDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={uploadPriceSheet}
        vendors={vendors}
      />
    </>
  );
};
