
// Quote-related type definitions
export interface DatabaseQuote {
  id: string;
  client_id: string | null;
  client_info_id: string | null;
  amount: number;
  date: string;
  description: string | null;
  quote_number: string | null;
  quote_month: string | null;
  quote_year: string | null;
  status: string | null;
  commission: number | null;
  commission_override: number | null;
  expires_at: string | null;
  notes: string | null;
  billing_address: string | null;
  service_address: string | null;
  template_id: string | null;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}
