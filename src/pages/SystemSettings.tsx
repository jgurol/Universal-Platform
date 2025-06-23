
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavigationBar } from "@/components/NavigationBar";
import { SystemSettingsProvider } from "@/context/SystemSettingsContext";
import { GeneralSettingsTab } from "@/components/settings/GeneralSettingsTab";
import { DateTimeSettingsTab } from "@/components/settings/DateTimeSettingsTab";
import { SecuritySettingsTab } from "@/components/settings/SecuritySettingsTab";

export default function SystemSettings() {
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
            <p>Please log in to access system settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SystemSettingsProvider>
      <div>
        <NavigationBar />
        <div className="container mx-auto py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Configuration</h1>
            <p className="text-gray-600">Configure global system settings and defaults</p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="datetime">Date & Time</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <GeneralSettingsTab />
            </TabsContent>

            <TabsContent value="datetime">
              <DateTimeSettingsTab />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SystemSettingsProvider>
  );
}
