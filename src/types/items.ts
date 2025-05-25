
export interface Item {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  charge_type?: string; // 'NRC' or 'MRC'
  category_id?: string;
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
