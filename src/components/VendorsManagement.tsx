
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Edit, Trash2, Globe, Mail, Phone } from "lucide-react";
import { useVendors } from "@/hooks/useVendors";
import { AddVendorDialog } from "@/components/AddVendorDialog";
import { EditVendorDialog } from "@/components/EditVendorDialog";
import { Badge } from "@/components/ui/badge";
import { Vendor } from "@/types/vendors";

export const VendorsManagement = () => {
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const { vendors, isLoading, addVendor, updateVendor } = useVendors();

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsEditVendorOpen(true);
  };

  const handleUpdateVendor = (vendorId: string, updates: Partial<Vendor>) => {
    updateVendor(vendorId, updates);
    setSelectedVendor(null);
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
            <Button onClick={() => setIsAddVendorOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No vendors yet</p>
              <p className="text-sm mb-4">Add your first vendor to get started</p>
              <Button onClick={() => setIsAddVendorOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vendor
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                      {vendor.contact_name && (
                        <Badge variant="outline" className="text-xs">
                          Contact: {vendor.contact_name}
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
                      {vendor.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {vendor.website}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditVendor(vendor)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddVendorDialog
        open={isAddVendorOpen}
        onOpenChange={setIsAddVendorOpen}
        onAddVendor={addVendor}
      />

      <EditVendorDialog
        open={isEditVendorOpen}
        onOpenChange={setIsEditVendorOpen}
        onUpdateVendor={handleUpdateVendor}
        vendor={selectedVendor}
      />
    </>
  );
};
