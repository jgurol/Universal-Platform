import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, AlertTriangle, Clock, FileText, Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

export default function SystemSettings() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", content: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [settings, setSettings] = useState({
    defaultCommissionRate: "15",
    companyName: "California Telecom",
    supportEmail: "support@californiatelecom.com",
    timezone: "America/Los_Angeles",
    businessAddress: "14538 Central Ave, Chino, CA 91710, United States",
    businessPhone: "213-270-1349",
    businessFax: "213-232-3304",
    showCompanyNameOnPDF: true
  });

  // Common timezones for the select dropdown
  const timezones = [
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Phoenix", label: "Arizona Time (MST)" },
    { value: "America/Anchorage", label: "Alaska Time (AKST)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
    { value: "UTC", label: "UTC (Coordinated Universal Time)" }
  ];

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Loading settings from database...');
        const { data, error } = await supabase
          .from('system_settings')
          .select('setting_key, setting_value');

        if (error) {
          console.error('Error loading settings:', error);
          toast({
            title: "Error loading settings",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data) {
          const settingsMap = data.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {} as Record<string, string>);

          console.log('Loaded settings from database:', settingsMap);

          setSettings({
            timezone: settingsMap.timezone || settings.timezone,
            companyName: settingsMap.company_name || settings.companyName,
            businessAddress: settingsMap.business_address || settings.businessAddress,
            businessPhone: settingsMap.business_phone || settings.businessPhone,
            businessFax: settingsMap.business_fax || settings.businessFax,
            supportEmail: settingsMap.support_email || settings.supportEmail,
            defaultCommissionRate: settingsMap.default_commission_rate || settings.defaultCommissionRate,
            showCompanyNameOnPDF: settingsMap.show_company_name_on_pdf !== 'false'
          });

          if (settingsMap.company_logo_url) {
            setLogoUrl(settingsMap.company_logo_url);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error loading settings",
          description: "Failed to load system settings",
          variant: "destructive",
        });
      }
    };

    loadSettings();
    fetchTemplates();
  }, []);

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading templates",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setLoading(true);
    try {
      // Convert to base64 for database storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        // Save logo URL to database
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: 'company_logo_url',
            setting_value: base64String,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        setLogoUrl(base64String);
        toast({
          title: "Logo uploaded",
          description: "Company logo has been saved successfully",
        });
        setLogoFile(null);
      };
      reader.readAsDataURL(logoFile);
    } catch (error: any) {
      toast({
        title: "Error uploading logo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'company_logo_url',
          setting_value: '',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setLogoUrl("");
      setLogoFile(null);
      toast({
        title: "Logo removed",
        description: "Company logo has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error removing logo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Validation error",
        description: "Please provide both name and content for the template",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quote_templates')
        .insert([{
          name: newTemplate.name.trim(),
          content: newTemplate.content.trim(),
          user_id: user?.id!
        }]);

      if (error) throw error;

      setNewTemplate({ name: "", content: "" });
      fetchTemplates();
      toast({
        title: "Template added",
        description: "Quote template has been created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error adding template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quote_templates')
        .update({
          name: editingTemplate.name,
          content: editingTemplate.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      setEditingTemplate(null);
      fetchTemplates();
      toast({
        title: "Template updated",
        description: "Quote template has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('quote_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      fetchTemplates();
      toast({
        title: "Template deleted",
        description: "Quote template has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      // First, unset all defaults
      await supabase
        .from('quote_templates')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Then set the selected one as default
      const { error } = await supabase
        .from('quote_templates')
        .update({ is_default: true })
        .eq('id', templateId);

      if (error) throw error;

      fetchTemplates();
      toast({
        title: "Default template set",
        description: "This template is now the default for new quotes",
      });
    } catch (error: any) {
      toast({
        title: "Error setting default",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Saving settings to database:', settings);

      // Use individual upsert operations to avoid constraint violations
      const settingsToUpdate = [
        { key: 'timezone', value: settings.timezone },
        { key: 'company_name', value: settings.companyName },
        { key: 'business_address', value: settings.businessAddress },
        { key: 'business_phone', value: settings.businessPhone },
        { key: 'business_fax', value: settings.businessFax },
        { key: 'support_email', value: settings.supportEmail },
        { key: 'default_commission_rate', value: settings.defaultCommissionRate },
        { key: 'show_company_name_on_pdf', value: settings.showCompanyNameOnPDF.toString() }
      ];

      // Update each setting individually
      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: setting.key,
            setting_value: setting.value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'setting_key'
          });

        if (error) {
          console.error(`Error updating setting ${setting.key}:`, error);
          throw error;
        }
      }

      console.log('Settings saved successfully to database');
      
      toast({
        title: "Settings saved",
        description: "System configuration has been updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Please log in to access system settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Configuration</h1>
        <p className="text-gray-600">Configure global system settings and defaults</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="datetime">Date & Time</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
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
                <form onSubmit={handleUpdateSettings} className="space-y-4">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Company Logo
                </CardTitle>
                <CardDescription>
                  Upload a company logo to be displayed on quote PDFs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {logoUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <img src={logoUrl} alt="Company Logo" className="h-16 w-auto object-contain border rounded" />
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-600">Current logo</p>
                        <Button variant="outline" size="sm" onClick={handleRemoveLogo}>
                          <X className="h-4 w-4 mr-2" />
                          Remove Logo
                        </Button>
                      </div>
                    </div>
                    <Separator />
                  </div>
                ) : null}
                
                <div className="space-y-3">
                  <Label htmlFor="logoUpload">Upload New Logo</Label>
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500">
                    Recommended: PNG or JPG format, max 2MB. Logo will be displayed in the top-left corner of quote PDFs.
                  </p>
                  {logoFile && (
                    <Button onClick={handleLogoUpload} disabled={loading}>
                      <Upload className="h-4 w-4 mr-2" />
                      {loading ? "Uploading..." : "Upload Logo"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="datetime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Date & Time Settings
              </CardTitle>
              <CardDescription>
                Configure timezone and date handling preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Application Timezone</Label>
                  <Select 
                    value={settings.timezone} 
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500">
                    This setting affects how dates are displayed and processed throughout the application.
                    Current setting: {settings.timezone}
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Timezone Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quote Templates
                </CardTitle>
                <CardDescription>
                  Manage terms and conditions templates that can be appended to quotes and included in PDFs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Template Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Template
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input
                        id="templateName"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="Enter template name (e.g., Standard Terms)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="templateContent">Terms & Conditions Content</Label>
                      <RichTextEditor
                        value={newTemplate.content}
                        onChange={(content) => setNewTemplate({ ...newTemplate, content })}
                        placeholder="Enter the terms and conditions text..."
                        rows={6}
                      />
                    </div>
                    <Button onClick={handleAddTemplate} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Template
                    </Button>
                  </div>
                </div>

                {/* Existing Templates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Existing Templates</h3>
                  {templates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No templates found. Create your first template above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <div key={template.id} className="border rounded-lg p-4 space-y-3">
                          {editingTemplate?.id === template.id ? (
                            // Edit Mode
                            <div className="space-y-3">
                              <Input
                                value={editingTemplate.name}
                                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                placeholder="Template name"
                              />
                              <RichTextEditor
                                value={editingTemplate.content}
                                onChange={(content) => setEditingTemplate({ ...editingTemplate, content })}
                                rows={6}
                              />
                              <div className="flex gap-2">
                                <Button onClick={handleUpdateTemplate} disabled={loading}>
                                  Save Changes
                                </Button>
                                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium flex items-center gap-2">
                                  {template.name}
                                  {template.is_default && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                                  )}
                                </h4>
                                <div className="flex gap-2">
                                  {!template.is_default && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSetDefaultTemplate(template.id)}
                                      disabled={loading}
                                    >
                                      Set as Default
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingTemplate(template)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                <div dangerouslySetInnerHTML={{ __html: template.content }} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security and access control settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Authentication Method:</span>
                  </div>
                  <span className="text-sm text-gray-600">Email & Password</span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">User Registration:</span>
                  </div>
                  <span className="text-sm text-gray-600">Enabled (Admin Approval Required)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Advanced database operations and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-700 mb-2">
                    <strong>Warning:</strong> These operations can affect system performance and data integrity.
                  </p>
                  <p className="text-sm text-orange-600">
                    Database maintenance and backup operations should be performed during off-peak hours.
                    Contact your system administrator for assistance with these operations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
