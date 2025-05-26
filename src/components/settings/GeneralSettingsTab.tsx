
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { LogoUploadSection } from "./LogoUploadSection";

export const GeneralSettingsTab: React.FC = () => {
  const { settings, setSettings, loading, saveSettings } = useSystemSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Configure basic system-wide settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showCompanyNameOnPDF"
                checked={settings.showCompanyNameOnPDF}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showCompanyNameOnPDF: checked as boolean }))}
              />
              <Label htmlFor="showCompanyNameOnPDF">Display company name on PDF quotes</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Input
                id="businessAddress"
                value={settings.businessAddress}
                onChange={(e) => setSettings(prev => ({ ...prev, businessAddress: e.target.value }))}
                placeholder="Enter complete business address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  value={settings.businessPhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessPhone: e.target.value }))}
                  placeholder="Enter business phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessFax">Business Fax</Label>
                <Input
                  id="businessFax"
                  value={settings.businessFax}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessFax: e.target.value }))}
                  placeholder="Enter business fax number"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                placeholder="Enter support email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultCommissionRate">Default Commission Rate (%)</Label>
              <Input
                id="defaultCommissionRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.defaultCommissionRate}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultCommissionRate: e.target.value }))}
                placeholder="Enter default commission rate"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <LogoUploadSection />
    </div>
  );
};
