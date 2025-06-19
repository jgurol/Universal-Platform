
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  companyName: string | null;
  commissionRate: number;
  totalEarnings: number;
  lastPayment: string;
}

export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  companyName: string;
  amount: number;
  date: string;
  description?: string;
  status: string;
  clientInfoId?: string;
  clientCompanyName?: string;
  commissionOverride?: number;
  notes?: string;
  quoteItems?: QuoteItem[];
  quoteNumber?: string;
  quoteMonth?: string;
  quoteYear?: string;
  term?: string;
  expiresAt?: string;
  acceptedAt?: string;
  commission?: number;
  archived?: boolean;
  billingAddress?: string;
  serviceAddress?: string;
  templateId?: string;
  emailStatus?: string;
  acceptanceStatus?: string;
  acceptedBy?: string;
  emailSentAt?: string;
  emailOpened?: boolean;
  emailOpenedAt?: string;
  emailOpenCount?: number;
}

export interface QuoteItem {
  id: string;
  quote_id?: string; // Make optional since it's not available when creating quotes
  item_id?: string;
  name?: string; // Make optional to match QuoteItemData
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  charge_type: 'MRC' | 'NRC';
  address_id?: string;
  item?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    sku?: string;
  };
  address?: {
    id: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
  };
}

export interface ClientInfo {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  revio_id: string | null;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  commission_override?: number;
}

export interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  companyName?: string;
  amount: number;
  date: string;
  description?: string;
  commissionRate?: number; // Make optional
  commissionAmount?: number; // Make optional
  status?: 'pending' | 'approved' | 'paid'; // Make optional
  isPaid: boolean;
  paidDate?: string;
  datePaid?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  clientInfoId?: string;
  clientCompanyName?: string;
  commission?: number;
  commissionPaidDate?: string;
  isApproved?: boolean;
  commissionOverride?: number;
  invoiceMonth?: string;
  invoiceYear?: string;
  invoiceNumber?: string;
}
