
export interface Item {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  price: number;
  mrc?: number; // Monthly Recurring Charge
  category?: string;
  sku?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  item?: Item; // Optional populated item data
}
