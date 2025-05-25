
import { Quote, ClientInfo } from '@/pages/Index';

export interface BusinessSettings {
  companyName: string;
  businessAddress: string;
  businessPhone: string;
  businessFax: string;
  showCompanyNameOnPDF: boolean;
  logoUrl: string;
}

export interface FormattedAddress {
  street: string;
  cityStateZip: string;
}

export interface AcceptanceDetails {
  client_name?: string;
  client_email?: string;
  accepted_at?: string;
  ip_address?: string;
  user_agent?: string;
  signature_data?: string;
}

export interface PDFGenerationContext {
  quote: Quote;
  clientInfo?: ClientInfo;
  salespersonName?: string;
  businessSettings: BusinessSettings;
  acceptanceDetails?: AcceptanceDetails;
  isApproved: boolean;
}
