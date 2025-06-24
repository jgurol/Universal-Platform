import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { BusinessSettings } from './types.ts';

export const fetchSystemSettings = async (): Promise<BusinessSettings> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Fetch company logo and settings from system_settings table
  const { data: settings, error: settingsError } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['company_logo_url', 'company_name']);
  
  if (settingsError) {
    console.error('Error fetching system settings:', settingsError);
  }
  
  // Extract logo URL and company name from settings
  let logoUrl = '';
  let companyName = 'California Telecom, Inc.';
  
  if (settings) {
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as Record<string, string>);
    
    logoUrl = settingsMap.company_logo_url || '';
    companyName = settingsMap.company_name || 'California Telecom, Inc.';
  }
  
  console.log('PDFShift Function - Logo URL configured:', !!logoUrl);
  console.log('PDFShift Function - Company name:', companyName);
  
  return { logoUrl, companyName };
};

export const fetchTemplate = async (templateId: string) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  console.log('PDFShift Function - Fetching template content for ID:', templateId);
  const { data: template, error: templateError } = await supabase
    .from('quote_templates')
    .select('content, name')
    .eq('id', templateId)
    .single();
  
  if (templateError) {
    console.error('PDFShift Function - Error fetching template:', templateError);
    return '';
  }
  
  if (template) {
    console.log('PDFShift Function - Template content loaded:', template.name, 'length:', template.content.length);
    return template.content;
  }
  
  return '';
};

export const fetchUserProfile = async (userId: string): Promise<string> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  console.log('PDFShift Function - Fetching user profile for user_id:', userId);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();
  
  if (profileError) {
    console.error('PDFShift Function - Error fetching user profile:', profileError);
    return 'N/A';
  }
  
  if (profile?.full_name) {
    console.log('PDFShift Function - Found user profile name:', profile.full_name);
    return profile.full_name;
  }
  
  console.log('PDFShift Function - Profile found but no full_name set');
  return 'N/A';
};

export const fetchAcceptanceDetails = async (quoteId: string) => {
  console.log('PDFShift Function - Fetching acceptance details for quote:', quoteId);
  
  try {
    const { data, error } = await supabase
      .from('quote_acceptances')
      .select('*')
      .eq('quote_id', quoteId)
      .single();

    if (error) {
      console.error('PDFShift Function - Error fetching acceptance details:', error);
      return null;
    }

    if (!data) {
      console.log('PDFShift Function - No acceptance details found');
      return null;
    }

    console.log('PDFShift Function - Acceptance details found:', {
      clientName: data.client_name,
      hasSignature: !!data.signature_data,
      acceptedAt: data.accepted_at
    });

    return {
      clientName: data.client_name,
      clientEmail: data.client_email,
      signatureData: data.signature_data,
      acceptedAt: data.accepted_at,
      ipAddress: data.ip_address?.toString() || undefined,
      userAgent: data.user_agent || undefined
    };
  } catch (error) {
    console.error('PDFShift Function - Exception fetching acceptance details:', error);
    return null;
  }
};
