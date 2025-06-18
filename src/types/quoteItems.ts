
import { Item } from "@/types/items";
import { ClientAddress } from "@/types/clientAddress";

export interface QuoteItemData {
  id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  cost_override?: number;
  total_price: number;
  charge_type: 'NRC' | 'MRC';
  address_id?: string;
  name?: string; // Editable name for this quote item
  description?: string; // Editable description for this quote item
  image_url?: string; // URL for uploaded image
  image_name?: string; // Name of uploaded image file
  item?: Item;
  address?: ClientAddress;
}
