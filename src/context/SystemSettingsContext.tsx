
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type QuoteTemplate = Database['public']['Tables']['quote_templates']['Row'];

interface SystemSettingsContextType {
  settings: {
    defaultCommissionRate: string;
    companyName: string;
    supportEmail: string;
    timezone: string;
    businessAddress: string;
    businessPhone: string;
    businessFax: string;
    showCompanyNameOnPDF: boolean;
  };
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  templates: QuoteTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<QuoteTemplate[]>>;
  logoUrl: string;
  setLogoUrl: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchTemplates: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
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
          businessFax: settingsMap.business_fax || "",
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

  const saveSettings = async () => {
    setLoading(true);

    try {
      console.log('Saving settings to database:', settings);

      const settingsToUpdate = [
        { key: 'timezone', value: settings.timezone },
        { key: 'company_name', value: settings.companyName },
        { key: 'business_address', value: settings.businessAddress },
        { key: 'business_phone', value: settings.businessPhone },
        { key: 'business_fax', value: settings.businessFax || '' },
        { key: 'support_email', value: settings.supportEmail },
        { key: 'default_commission_rate', value: settings.defaultCommissionRate },
        { key: 'show_company_name_on_pdf', value: settings.showCompanyNameOnPDF.toString() }
      ];

      for (const setting of settingsToUpdate) {
        console.log(`Updating setting ${setting.key} with value:`, setting.value);
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

  useEffect(() => {
    loadSettings();
    fetchTemplates();
  }, []);

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        setSettings,
        templates,
        setTemplates,
        logoUrl,
        setLogoUrl,
        loading,
        setLoading,
        fetchTemplates,
        saveSettings,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};
