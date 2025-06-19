
export interface Category {
  id: string;
  name: string;
  description?: string;
  type?: 'Circuit' | 'Network' | 'Managed Services' | 'AI' | 'VOIP';
  standard_markup?: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}
