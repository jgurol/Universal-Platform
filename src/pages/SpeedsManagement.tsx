
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { NavigationBar } from "@/components/NavigationBar";
import { SpeedsManagement } from "@/components/SpeedsManagement";

export default function SpeedsManagementPage() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!user) {
    return (
      <div>
        <NavigationBar />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <p>Please log in to access speeds management.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Speed Options Management</h1>
          <p className="text-gray-600">Manage speed options available for carrier quotes</p>
        </div>

        <SpeedsManagement />
      </div>
    </div>
  );
}
