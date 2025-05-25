
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
  item?: Item;
  address?: ClientAddress;
}
