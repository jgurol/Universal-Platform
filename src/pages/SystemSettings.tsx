import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavigationBar } from "@/components/NavigationBar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemSettingsProvider } from "@/context/SystemSettingsContext";
import { GeneralSettingsTab } from "@/components/settings/GeneralSettingsTab";
import { DateTimeSettingsTab } from "@/components/settings/DateTimeSettingsTab";
import { SecuritySettingsTab } from "@/components/settings/SecuritySettingsTab";
import { AgentsManagementTab } from "@/components/settings/AgentsManagementTab";
import { QuoteTemplatesTab } from "@/components/settings/QuoteTemplatesTab";
import { AgentAgreementTemplatesTab } from "@/components/settings/AgentAgreementTemplatesTab";
import { useState } from "react";

export default function SystemSettings() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  if (!isAdmin) {
    return (
      <div>
        <NavigationBar />
        <div className="container mx-auto px-4 py-8">
          <Header />
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You don't have permission to access system settings.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
        <div className="container mx-auto px-4 py-8">
          <Header />
          
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Manage system-wide settings and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="datetime">Date & Time</TabsTrigger>
                  <TabsTrigger value="agents">Agents</TabsTrigger>
                  <TabsTrigger value="quote-templates">Quote Templates</TabsTrigger>
                  <TabsTrigger value="agent-agreements">Agent Agreements</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="mt-6">
                  <GeneralSettingsTab />
                </TabsContent>
                
                <TabsContent value="security" className="mt-6">
                  <SecuritySettingsTab />
                </TabsContent>
                
                <TabsContent value="datetime" className="mt-6">
                  <DateTimeSettingsTab />
                </TabsContent>
                
                <TabsContent value="agents" className="mt-6">
                  <AgentsManagementTab />
                </TabsContent>
                
                <TabsContent value="quote-templates" className="mt-6">
                  <QuoteTemplatesTab />
                </TabsContent>
                
                <TabsContent value="agent-agreements" className="mt-6">
                  <AgentAgreementTemplatesTab />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </SystemSettingsProvider>
  );
}
