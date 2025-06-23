
import { NavigationBar } from "@/components/NavigationBar";
import { SystemSettingsProvider } from "@/context/SystemSettingsContext";
import { QuoteTemplatesTab } from "@/components/settings/QuoteTemplatesTab";
import { EmailTemplatesManagement } from "@/components/EmailTemplatesManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Templates = () => {
  return (
    <SystemSettingsProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <NavigationBar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates Management</h1>
            <p className="text-gray-600">Manage quote templates, email templates, and terms & conditions</p>
          </div>
          
          <Tabs defaultValue="quote-templates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quote-templates">Quote Templates</TabsTrigger>
              <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quote-templates" className="mt-6">
              <QuoteTemplatesTab />
            </TabsContent>
            
            <TabsContent value="email-templates" className="mt-6">
              <EmailTemplatesManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SystemSettingsProvider>
  );
};

export default Templates;
