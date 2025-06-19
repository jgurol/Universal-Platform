
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
  expiresAt?: string;
  acceptedAt?: string;
  commission?: number;
  archived?: boolean;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  charge_type: 'MRC' | 'NRC';
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
}

export interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  description?: string;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid';
  isPaid: boolean;
  paidDate?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  clientInfoId?: string;
}
