
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, User, FileText, ExternalLink, AlertCircle } from "lucide-react";
import { useVendors } from "@/hooks/useVendors";
import { useVendorPriceSheets } from "@/hooks/useVendorPriceSheets";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const VendorsView = () => {
  const { vendors, isLoading } = useVendors();
  const { priceSheets } = useVendorPriceSheets();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  console.log('VendorsView - Total price sheets:', priceSheets.length);
  console.log('VendorsView - Public price sheets:', priceSheets.filter(sheet => sheet.is_public).length);
  console.log('VendorsView - isAdmin:', isAdmin);

  const getSalesModelBadgeColor = (salesModel?: string) => {
    switch (salesModel) {
      case 'agent':
        return 'bg-blue-100 text-blue-800';
      case 'partner':
        return 'bg-green-100 text-green-800';
      case 'wholesale':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPublicPriceSheetsForVendor = (vendorId: string) => {
    // For admins, show all price sheets for the vendor
    // For agents, show only public price sheets for the vendor
    return priceSheets.filter(sheet => {
      if (sheet.vendor_id === vendorId) {
        return isAdmin || sheet.is_public === true;
      }
      return false;
    });
  };

  const handleOpenPriceSheet = async (priceSheet: any) => {
    try {
      console.log('Opening price sheet with path:', priceSheet.file_path);
      
      // First, let's check if the file exists in storage
      const { data: fileList, error: listError } = await supabase.storage
        .from('vendor-price-sheets')
        .list('', { search: priceSheet.file_path });

      if (listError) {
        console.error('Error listing files:', listError);
        toast({
          title: "Storage Error",
          description: `Cannot access storage: ${listError.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Files found in storage:', fileList);

      // Check if our specific file exists
      const fileExists = fileList && fileList.some(file => 
        priceSheet.file_path.includes(file.name)
      );

      if (!fileExists) {
        console.error('File not found in storage:', priceSheet.file_path);
        toast({
          title: "File Not Found",
          description: `The file "${priceSheet.name}" was not found in storage. It may have been deleted or moved.`,
          variant: "destructive"
        });
        return;
      }

      // Try to create signed URL
      const { data, error } = await supabase.storage
        .from('vendor-price-sheets')
        .createSignedUrl(priceSheet.file_path, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        toast({
          title: "Access Error",
          description: `Cannot access file: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Successfully created signed URL');

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
          description: `${priceSheet.name} is opening in a popup window.`,
        });
      }
    } catch (error) {
      console.error('Unexpected error opening price sheet:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while opening the price sheet",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading vendors...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <CardTitle>Vendors</CardTitle>
          <Badge variant="outline" className="ml-2">
            {vendors.length} vendors
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {vendors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No vendors available</p>
            <p className="text-sm">Vendors will appear here once they are added by administrators</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendors.map((vendor) => {
              const publicPriceSheets = getPublicPriceSheetsForVendor(vendor.id);
              
              return (
                <div key={vendor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: vendor.color || '#3B82F6' }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                        {isAdmin && vendor.dba && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            DBA: {vendor.dba}
                          </Badge>
                        )}
                        {isAdmin && vendor.rep_name && (
                          <Badge variant="outline" className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            {vendor.rep_name}
                          </Badge>
                        )}
                        {isAdmin && vendor.sales_model && (
                          <Badge variant="outline" className={`text-xs ${getSalesModelBadgeColor(vendor.sales_model)}`}>
                            {vendor.sales_model.charAt(0).toUpperCase() + vendor.sales_model.slice(1)}
                          </Badge>
                        )}
                      </div>
                      {vendor.description && (
                        <p className="text-sm text-gray-600 mb-2">{vendor.description}</p>
                      )}
                      {isAdmin && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {vendor.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {vendor.email}
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {vendor.phone}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Public Price Sheets - Show for both admins and agents */}
                      {publicPriceSheets.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            {isAdmin ? "Price Sheets:" : "Public Price Sheets:"}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {publicPriceSheets.map((sheet) => (
                              <Button
                                key={sheet.id}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleOpenPriceSheet(sheet)}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                {sheet.name}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
