export interface PDFRequest {
  quote: any;
  clientInfo?: any;
  salespersonName?: string;
  primaryContact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    title: string | null;
    is_primary: boolean;
  };
}

export interface BusinessSettings {
  logoUrl?: string;
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface AcceptanceDetails {
  clientName: string;
  clientEmail: string | null;
  signatureData: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}
