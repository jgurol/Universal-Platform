
import { NavigationBar } from "@/components/NavigationBar";
import { VendorsManagement } from "@/components/VendorsManagement";

const Vendors = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Management</h1>
          <p className="text-gray-600">Manage vendors and supplier information</p>
        </div>

        <VendorsManagement />
      </div>
    </div>
  );
};

export default Vendors;
