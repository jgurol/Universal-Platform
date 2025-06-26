
import { NavigationBar } from "@/components/NavigationBar";
import { QuickNavigation } from "@/components/QuickNavigation";
import { CircuitTrackingManagement } from "@/components/CircuitTrackingManagement";

const CircuitTracking = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <QuickNavigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Circuit Tracking</h1>
          <p className="text-gray-600">Monitor and manage circuit installation progress</p>
        </div>

        {/* Circuit Tracking Management */}
        <CircuitTrackingManagement />
      </div>
    </div>
  );
};

export default CircuitTracking;
