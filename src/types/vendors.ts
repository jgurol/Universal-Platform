
export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
