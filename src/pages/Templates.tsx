
import { NavigationBar } from "@/components/NavigationBar";
import { SystemSettingsProvider } from "@/context/SystemSettingsContext";
import { QuoteTemplatesTab } from "@/components/settings/QuoteTemplatesTab";

const Templates = () => {
  return (
    <SystemSettingsProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <NavigationBar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates Management</h1>
            <p className="text-gray-600">Manage quote templates and terms & conditions</p>
          </div>
          <QuoteTemplatesTab />
        </div>
      </div>
    </SystemSettingsProvider>
  );
};

export default Templates;
