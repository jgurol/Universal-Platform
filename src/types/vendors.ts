
export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  rep_name?: string;
  email?: string;
  phone?: string;
  sales_model?: 'agent' | 'partner' | 'wholesale';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
