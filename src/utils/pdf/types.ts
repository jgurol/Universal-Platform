
import { Quote, ClientInfo, QuoteItem } from "@/types/index";

export interface PDFGenerationContext {
  quote: Quote;
  clientInfo?: ClientInfo;
  quoteItems: QuoteItem[];
  salespersonName: string;
  primaryContact?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    title: string | null;
  } | null;
  businessSettings?: BusinessSettings;
  acceptanceDetails?: AcceptanceDetails;
  isApproved?: boolean;
}

export interface FormattedAddress {
  street: string;
  cityStateZip?: string;
}

export interface AcceptanceDetails {
  clientName: string;
  clientEmail: string;
  signatureData: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BusinessSettings {
  logoUrl?: string;
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}
