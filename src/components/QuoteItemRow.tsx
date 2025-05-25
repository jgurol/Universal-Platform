
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, MapPin } from "lucide-react";
import { QuoteItemData } from "@/types/quoteItems";
import { ClientAddress } from "@/types/clientAddress";

interface QuoteItemRowProps {
  quoteItem: QuoteItemData;
  addresses: ClientAddress[];
  onUpdateItem: (itemId: string, field: keyof QuoteItemData, value: number | string) => void;
  onRemoveItem: (itemId: string) => void;
}

export const QuoteItemRow = ({ quoteItem, addresses, onUpdateItem, onRemoveItem }: QuoteItemRowProps) => {
  const formatAddressShort = (address: any) => {
    if (!address) return 'No address';
    return `${address.address_type} - ${address.city}, ${address.state}`;
  };

  return (
    <div className="grid grid-cols-6 gap-2 items-start p-3 border rounded bg-gray-50">
      {/* Item & Location Column */}
      <div className="col-span-2 space-y-2">
        <div className="text-sm font-medium">
          {quoteItem.item?.name || 'Unknown Item'}
        </div>
        <div className="space-y-1">
          <Textarea
            value={quoteItem.description || quoteItem.item?.description || ''}
            onChange={(e) => onUpdateItem(quoteItem.id, 'description', e.target.value)}
            placeholder="Item description"
            className="text-xs min-h-[60px] resize-none"
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          <Select 
            value={quoteItem.address_id || ""} 
            onValueChange={(value) => onUpdateItem(quoteItem.id, 'address_id', value)}
          >
            <SelectTrigger className="text-xs h-6 border-gray-300">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              {addresses.length === 0 ? (
                <SelectItem value="no-addresses" disabled>No addresses available</SelectItem>
              ) : (
                addresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {formatAddressShort(address)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <Input
          type="number"
          min="1"
          value={quoteItem.quantity}
          onChange={(e) => onUpdateItem(quoteItem.id, 'quantity', parseInt(e.target.value) || 1)}
          className="text-xs h-8"
          placeholder="Qty"
        />
      </div>

      {/* Sell Price / Cost */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Sell:</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={quoteItem.unit_price}
            onChange={(e) => onUpdateItem(quoteItem.id, 'unit_price', parseFloat(e.target.value) || 0)}
            className="text-xs h-8"
            placeholder="$"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Cost:</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={quoteItem.cost_override || 0}
            onChange={(e) => onUpdateItem(quoteItem.id, 'cost_override', parseFloat(e.target.value) || 0)}
            className="text-xs h-8"
            placeholder="$"
          />
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          ${quoteItem.total_price.toFixed(2)}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemoveItem(quoteItem.id)}
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Type Column */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-1">
          <Switch
            checked={quoteItem.charge_type === 'MRC'}
            onCheckedChange={(checked) => onUpdateItem(quoteItem.id, 'charge_type', checked ? 'MRC' : 'NRC')}
          />
          <span className="text-xs font-medium">
            {quoteItem.charge_type}
          </span>
        </div>
      </div>
    </div>
  );
};
