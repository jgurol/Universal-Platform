import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, User, FolderIcon, Plus } from "lucide-react";
import { useVendors } from "@/hooks/useVendors";
import { useAuth } from "@/context/AuthContext";
import { AddVendorDialog } from "@/components/AddVendorDialog";
import { VendorAttachmentsDialog } from "@/components/VendorAttachmentsDialog";
import { useState } from "react";
import { Vendor } from "@/types/vendors";
import { useVendorAttachments } from "@/hooks/useVendorAttachments";

export const VendorsView = () => {
  const { vendors, isLoading, addVendor } = useVendors();
  const { isAdmin } = useAuth();
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const { getTotalAttachmentCount } = useVendorAttachments();

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

  const handleViewAttachments = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsAttachmentsOpen(true);
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle>Vendors</CardTitle>
              <Badge variant="outline" className="ml-2">
                {vendors.length} vendors
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsAddVendorOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
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
                const attachmentCount = getTotalAttachmentCount(vendor.id);
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewAttachments(vendor)}
                        className="text-blue-600 hover:text-blue-700 relative"
                        title="View Attachments"
                      >
                        <FolderIcon className="h-4 w-4" />
                        {attachmentCount > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600 text-white"
                          >
                            {attachmentCount}
                          </Badge>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddVendorDialog
        open={isAddVendorOpen}
        onOpenChange={setIsAddVendorOpen}
        onAddVendor={addVendor}
      />

      <VendorAttachmentsDialog
        open={isAttachmentsOpen}
        onOpenChange={setIsAttachmentsOpen}
        vendor={selectedVendor}
      />
    </>
  );
};
