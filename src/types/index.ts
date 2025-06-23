export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  companyName?: string;
  amount: number;
  date: string;
  description: string;
  quoteNumber?: string;
  quoteMonth?: string;
  quoteYear?: string;
  term?: string;
  status: "pending" | "approved" | "rejected" | "sent" | "archived";
  clientInfoId?: string;
  clientCompanyName?: string;
  commissionOverride?: number;
  expiresAt?: string;
  notes?: string;
  quoteItems?: QuoteItemData[];
  billingAddress?: string;
  serviceAddress?: string;
  templateId?: string;
  salespersonName?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  commissionRate?: number;
  totalEarnings?: number;
  lastPayment?: string;
}

export interface ClientInfo {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  agent_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  description: string;
  commissionRate: number;
  commissionAmount: number;
  commissionStatus: "pending" | "approved" | "paid";
  quoteId?: string;
  clientInfoId?: string;
  companyName?: string;
}

export interface QuoteItemData {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  vendor?: string;
}

// Export deal types
export interface AddDealData {
  deal_name: string;
  deal_value: number;
  stage: string;
  client_info_id: string;
  description?: string;
  expected_close_date?: string;
  probability?: number;
  source?: string;
  notes?: string;
}

export interface DealRegistration {
  id: string;
  deal_name: string;
  deal_value: number;
  stage: string;
  client_info_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  description?: string;
  expected_close_date?: string;
  probability?: number;
  source?: string;
  notes?: string;
}
