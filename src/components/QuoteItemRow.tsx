import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, MapPin, FileText, GripVertical } from "lucide-react";
import { QuoteItemData } from "@/types/quoteItems";
import { ClientAddress } from "@/types/clientAddress";
import { AdvancedTiptapEditor } from "@/components/AdvancedTiptapEditor";

interface QuoteItemRowProps {
  quoteItem: QuoteItemData;
  addresses: ClientAddress[];
  onUpdateItem: (itemId: string, field: keyof QuoteItemData, value: number | string) => void;
  onRemoveItem: (itemId: string) => void;
}

export const QuoteItemRow = ({ quoteItem, addresses, onUpdateItem, onRemoveItem }: QuoteItemRowProps) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [tempDescription, setTempDescription] = useState(quoteItem.description || quoteItem.item?.description || '');

  // Calculate profit margin percentage
  const calculateProfitMargin = (): string => {
    const sellPrice = quoteItem.unit_price || 0;
    const cost = quoteItem.cost_override || quoteItem.item?.cost || 0;
    
    if (cost === 0) return '0%';
    
    const margin = ((sellPrice - cost) / cost) * 100;
    return `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%`;
  };

  const getProfitMarginColor = (): string => {
    const sellPrice = quoteItem.unit_price || 0;
    const cost = quoteItem.cost_override || quoteItem.item?.cost || 0;
    
    if (cost === 0) return 'text-gray-500';
    
    const margin = ((sellPrice - cost) / cost) * 100;
    
    if (margin > 20) return 'text-green-600';
    if (margin > 0) return 'text-blue-600';
    if (margin === 0) return 'text-gray-500';
    return 'text-red-600';
  };

  // Update tempDescription when dialog opens or quoteItem changes
  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      // Reset temp description to current value when opening
      setTempDescription(quoteItem.description || quoteItem.item?.description || '');
    }
    setIsDescriptionOpen(open);
  };

  const formatAddressShort = (address: any) => {
    if (!address) return 'No address';
    return `${address.address_type} - ${address.city}, ${address.state}`;
  };

  const handleDescriptionSave = () => {
    console.log('[QuoteItemRow] Saving description:', tempDescription);
    onUpdateItem(quoteItem.id, 'description', tempDescription);
    setIsDescriptionOpen(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(quoteItem.description || quoteItem.item?.description || '');
    setIsDescriptionOpen(false);
  };

  const handleAddressChange = (addressId: string) => {
    console.log(`[QuoteItemRow] Address changed for item ${quoteItem.id} to address ${addressId}`);
    onUpdateItem(quoteItem.id, 'address_id', addressId);
  };

  console.log(`[QuoteItemRow] Rendering item ${quoteItem.id} with description:`, { 
    description: quoteItem.description?.substring(0, 100)
  });

  // Function to strip HTML and get plain text preview for button
  const getDescriptionPreview = (description: string): string => {
    if (!description) return '';
    
    // Remove HTML tags and format for preview
    const plainText = description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    return plainText.length > 30 ? `${plainText.substring(0, 30)}...` : plainText;
  };

  const currentDescription = quoteItem.description || quoteItem.item?.description || '';

  return (
    <div className="flex items-start gap-2 p-3 border rounded bg-gray-50">
      {/* Drag Handle */}
      <div className="flex items-center justify-center pt-2">
        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-6 gap-2 items-start flex-1">
        {/* Item & Location Column */}
        <div className="col-span-2 space-y-2">
          <Input
            value={quoteItem.name || quoteItem.item?.name || ''}
            onChange={(e) => onUpdateItem(quoteItem.id, 'name', e.target.value)}
            placeholder="Item name"
            className="text-sm font-medium h-8"
          />
          <div className="space-y-1">
            {/* Rich text description display */}
            {currentDescription && (
              <div 
                className="text-xs text-gray-700 p-2 bg-white border rounded prose prose-xs max-w-none"
                dangerouslySetInnerHTML={{ __html: currentDescription }}
                style={{ 
                  maxHeight: '100px', 
                  overflowY: 'auto',
                  fontSize: '11px',
                  lineHeight: '1.3'
                }}
              />
            )}
            <Dialog open={isDescriptionOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 justify-start text-xs text-gray-600"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {currentDescription ? 
                    'Edit description' : 
                    'Add description'
                  }
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Edit Item Description</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <AdvancedTiptapEditor
                    value={tempDescription}
                    onChange={setTempDescription}
                    placeholder="Enter item description with formatting and images..."
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleDescriptionCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleDescriptionSave} className="bg-blue-600 hover:bg-blue-700">
                      Save Description
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <Select 
              value={quoteItem.address_id || ""} 
              onValueChange={handleAddressChange}
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

        {/* Sell Price / Cost with Profit Margin */}
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
          <div className="flex items-center justify-center">
            <span className={`text-xs font-medium ${getProfitMarginColor()}`}>
              {calculateProfitMargin()}
            </span>
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
    </div>
  );
};
