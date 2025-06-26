import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Edit, Trash2, Mail, Phone, Zap, Copy, FolderIcon, Search } from "lucide-react";
import { useVendors } from "@/hooks/useVendors";
import { AddVendorDialog } from "@/components/AddVendorDialog";
import { EditVendorDialog } from "@/components/EditVendorDialog";
import { VendorAttachmentsDialog } from "@/components/VendorAttachmentsDialog";
import { SpeedsManagement } from "@/components/SpeedsManagement";
import { Badge } from "@/components/ui/badge";
import { Vendor } from "@/types/vendors";
import { useToast } from "@/hooks/use-toast";
import { useVendorAttachments } from "@/hooks/useVendorAttachments";
import { useAuth } from "@/context/AuthContext";

export const VendorsView = () => {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [showSpeedsManagement, setShowSpeedsManagement] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { vendors, isLoading, addVendor, updateVendor, deleteVendor } = useVendors();
  const { toast } = useToast();
  const { getTotalAttachmentCount } = useVendorAttachments();
  const { isAdmin } = useAuth();

  // Filter vendors based on search query
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.rep_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.dba?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.sales_model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsEditVendorOpen(true);
  };

  const handleViewAttachments = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsAttachmentsOpen(true);
  };

  const handleDuplicateVendor = (vendor: Vendor) => {
    const duplicatedVendor = {
      name: `${vendor.name} (Copy)`,
      dba: vendor.dba,
      description: vendor.description,
      rep_name: vendor.rep_name,
      email: vendor.email,
      phone: vendor.phone,
      sales_model: vendor.sales_model,
      color: vendor.color,
      is_active: true
    };
    addVendor(duplicatedVendor);
  };

  const handleUpdateVendor = (vendorId: string, updates: Partial<Vendor>) => {
    updateVendor(vendorId, updates);
    setSelectedVendor(null);
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    if (window.confirm(`Are you sure you want to delete "${vendor.name}"? This action cannot be undone.`)) {
      deleteVendor(vendor.id);
    }
  };

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading vendors...</div>
        </CardContent>
      </Card>
    );
  }

  if (showSpeedsManagement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowSpeedsManagement(false)}
            variant="outline"
          >
            ← Back to Vendors
          </Button>
          <h2 className="text-xl font-semibold">Speed Options Management</h2>
        </div>
        <SpeedsManagement />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle>Vendors</CardTitle>
              <Badge variant="outline" className="ml-2">
                {filteredVendors.length} of {vendors.length} vendors
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button 
                  onClick={() => setShowSpeedsManagement(true)} 
                  variant="outline"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Manage Speeds
                </Button>
              )}
              {isAdmin && (
                <Button onClick={() => setIsAddVendorOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No vendors yet</p>
              <p className="text-sm mb-4">Add your first vendor to get started</p>
              {isAdmin && (
                <Button onClick={() => setIsAddVendorOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Vendor
                </Button>
              )}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No vendors found</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVendors.map((vendor) => {
                const attachmentCount = getTotalAttachmentCount(vendor.id);
                return (
                  <div key={vendor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: vendor.color || '#3B82F6' }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                          {vendor.rep_name && (
                            <Badge variant="outline" className="text-xs">
                              Rep: {vendor.rep_name}
                            </Badge>
                          )}
                          {vendor.sales_model && (
                            <Badge variant="outline" className={`text-xs ${getSalesModelBadgeColor(vendor.sales_model)}`}>
                              {vendor.sales_model.charAt(0).toUpperCase() + vendor.sales_model.slice(1)}
                            </Badge>
                          )}
                        </div>
                        {vendor.description && (
                          <p className="text-sm text-gray-600 mb-2">{vendor.description}</p>
                        )}
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
                      {isAdmin && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDuplicateVendor(vendor)}
                            className="text-green-600 hover:text-green-700"
                            title="Duplicate Vendor"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditVendor(vendor)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteVendor(vendor)}
                            title="Delete Vendor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <AddVendorDialog
          open={isAddVendorOpen}
          onOpenChange={setIsAddVendorOpen}
          onAddVendor={addVendor}
        />
      )}

      {isAdmin && (
        <EditVendorDialog
          open={isEditVendorOpen}
          onOpenChange={setIsEditVendorOpen}
          onUpdateVendor={handleUpdateVendor}
          vendor={selectedVendor}
        />
      )}

      <VendorAttachmentsDialog
        open={isAttachmentsOpen}
        onOpenChange={setIsAttachmentsOpen}
        vendor={selectedVendor}
      />
    </div>
  );
};
