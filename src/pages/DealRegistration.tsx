
import { NavigationBar } from "@/components/NavigationBar";
import { QuickNavigation } from "@/components/QuickNavigation";
import { DealRegistrationCard } from "@/components/DealRegistrationCard";
import { useClientManagement } from "@/hooks/useClientManagement";

const DealRegistration = () => {
  const { clientInfos, agentMapping } = useClientManagement();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationBar />
      <QuickNavigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Deal Registration Section */}
        <div className="mt-8">
          <DealRegistrationCard 
            clientInfos={clientInfos}
            agentMapping={agentMapping}
          />
        </div>
      </div>
    </div>
  );
};

export default DealRegistration;
