
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
  description: string;
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
  archived: boolean;
  billingAddress?: string;
  serviceAddress?: string;
  templateId?: string;
  emailStatus?: string;
  acceptedBy?: string;
  emailSentAt?: string;
  emailOpened?: boolean;
  emailOpenedAt?: string;
  emailOpenCount?: number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteItem {
  id: string;
  quote_id?: string;
  item_id?: string;
  name?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  charge_type: 'MRC' | 'NRC';
  address_id?: string;
  item?: {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    price: number;
    cost: number;
    sku?: string;
    charge_type?: string;
    category_id?: string;
    vendor_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  address?: {
    id: string;
    client_info_id: string;
    address_type: string;
    street_address: string;
    street_address_2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
  };
}

// Update ClientInfo to match actual database schema
export interface ClientInfo {
  id: string;
  company_name: string;
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
  commissionRate?: number;
  commissionAmount?: number;
  status?: 'pending' | 'approved' | 'paid';
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
