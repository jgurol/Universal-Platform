
import { Item } from "@/types/items";
import { ClientAddress } from "@/types/clientAddress";

export interface QuoteItemData {
  id: string;
  item_id?: string; // Make optional to match QuoteItem
  quantity: number;
  unit_price: number;
  cost_override?: number;
  total_price: number;
  charge_type: 'NRC' | 'MRC';
  address_id?: string;
  name?: string; // Editable name for this quote item
  description?: string; // Rich text description with embedded images (markdown format)
  image_url?: string; // Legacy field - kept for backward compatibility
  image_name?: string; // Legacy field - kept for backward compatibility
  item?: Item;
  address?: ClientAddress;
}
