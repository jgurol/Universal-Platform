
export interface Category {
  id: string;
  name: string;
  description?: string;
  type?: 'Circuit' | 'Network' | 'Managed Services' | 'AI' | 'VOIP';
  minimum_markup?: number;
  default_selected?: boolean;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}
