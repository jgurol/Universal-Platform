
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, User } from "lucide-react";
import { useVendors } from "@/hooks/useVendors";

export const VendorsView = () => {
  const { vendors, isLoading } = useVendors();

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
            {vendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: vendor.color || '#3B82F6' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                      {vendor.dba && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          DBA: {vendor.dba}
                        </Badge>
                      )}
                      {vendor.rep_name && (
                        <Badge variant="outline" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          {vendor.rep_name}
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
