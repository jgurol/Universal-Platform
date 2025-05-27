
import { OrdersCard } from "@/components/OrdersCard";
import { CircuitTrackingCard } from "@/components/CircuitTrackingCard";
import { SettingsCard } from "@/components/SettingsCard";

export const ProgramsGrid = () => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Applications</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <OrdersCard />
        <CircuitTrackingCard />
        <SettingsCard />
      </div>
    </div>
  );
};
