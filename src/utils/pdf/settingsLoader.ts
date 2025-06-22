
import { supabase } from '@/integrations/supabase/client';
import { BusinessSettings } from './types';

export const loadSettingsFromDatabase = async (): Promise<BusinessSettings> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value');

    if (error) {
      console.error('Error loading settings for PDF:', error);
      return getDefaultSettings();
    }

    if (data) {
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>);

      return {
        companyName: settingsMap.company_name || 'California Telecom, Inc.',
        address: settingsMap.business_address || '14538 Central Ave, Chino, CA 91710, United States',
        businessAddress: settingsMap.business_address || '14538 Central Ave, Chino, CA 91710, United States',
        phone: settingsMap.business_phone || '213-270-1349',
        businessPhone: settingsMap.business_phone || '213-270-1349',
        businessFax: settingsMap.business_fax || '',
        showCompanyNameOnPDF: settingsMap.show_company_name_on_pdf !== 'false',
        logoUrl: settingsMap.company_logo_url || ''
      };
    }
  } catch (error) {
    console.error('Error loading settings for PDF:', error);
  }
  
  return getDefaultSettings();
};

const getDefaultSettings = (): BusinessSettings => ({
  companyName: 'California Telecom, Inc.',
  address: '14538 Central Ave, Chino, CA 91710, United States',
  businessAddress: '14538 Central Ave, Chino, CA 91710, United States',
  phone: '213-270-1349',
  businessPhone: '213-270-1349',
  businessFax: '',
  showCompanyNameOnPDF: true,
  logoUrl: ''
});
