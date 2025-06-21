import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, MapPin, FileText, GripVertical, Percent } from "lucide-react";
import { QuoteItemData } from "@/types/quoteItems";
import { ClientAddress } from "@/types/clientAddress";
import { AdvancedTiptapEditor } from "@/components/AdvancedTiptapEditor";
import { SecureHtmlDisplay } from "@/components/SecureHtmlDisplay";
import { secureTextSchema } from "@/utils/securityUtils";
import { useCategories } from "@/hooks/useCategories";
import { calculateMarkupAndCommission } from "@/services/markupCommissionService";
import { useAuth } from "@/context/AuthContext";
import { useClients } from "@/hooks/useClients";

interface QuoteItemRowProps {
  quoteItem: QuoteItemData;
  addresses: ClientAddress[];
  onUpdateItem: (itemId: string, field: keyof QuoteItemData, value: number | string) => void;
  onRemoveItem: (itemId: string) => void;
}

export const QuoteItemRow = ({ quoteItem, addresses, onUpdateItem, onRemoveItem }: QuoteItemRowProps) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [tempDescription, setTempDescription] = useState(quoteItem.description || quoteItem.item?.description || '');
  const [commissionRate, setCommissionRate] = useState<number>(15); // Default 15%, should come from agent settings
  
  const { categories } = useCategories();
  const { user } = useAuth();
  const { clients } = useClients(null); // Pass null as associatedAgentId parameter

  // Find the category for this item
  const itemCategory = categories.find(cat => cat.id === quoteItem.item?.category_id);
  
  // Get agent commission rate from clients data
  const currentAgent = clients.find(client => client.id === user?.id);
  const agentCommissionRate = currentAgent?.commissionRate || 15;

  // Calculate markup and commission based on current values
  const cost = quoteItem.cost_override || quoteItem.item?.cost || 0;
  const sellPrice = quoteItem.unit_price || 0;
  
  const markupCalculation = calculateMarkupAndCommission(
    cost,
    sellPrice,
    commissionRate,
    itemCategory
  );

  // Calculate profit margin percentage
  const calculateProfitMargin = (): string => {
    if (cost === 0) return '0%';
    
    const margin = ((sellPrice - cost) / cost) * 100;
    return `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%`;
  };

  const getProfitMarginColor = (): string => {
    if (cost === 0) return 'text-gray-500';
    
    const margin = ((sellPrice - cost) / cost) * 100;
    
    if (margin > 20) return 'text-green-600';
    if (margin > 0) return 'text-blue-600';
    if (margin === 0) return 'text-gray-500';
    return 'text-red-600';
  };

  // Handle commission rate change and update sell price accordingly
  const handleCommissionRateChange = (newCommissionRate: number) => {
    // Don't allow commission to go below 0 or above agent's max rate
    if (newCommissionRate < 0 || newCommissionRate > agentCommissionRate) {
      return;
    }

    setCommissionRate(newCommissionRate);

    // If there's a minimum markup category, adjust the markup based on commission reduction
    if (itemCategory?.minimum_markup) {
      const originalMinimumMarkup = itemCategory.minimum_markup;
      const commissionReduction = agentCommissionRate - newCommissionRate;
      
      // Reduce the minimum markup by the same amount as the commission reduction
      const adjustedMinimumMarkup = Math.max(0, originalMinimumMarkup - commissionReduction);
      
      // Calculate new sell price based on adjusted minimum markup
      const newSellPrice = cost * (1 + adjustedMinimumMarkup / 100);
      
      // Update the sell price
      onUpdateItem(quoteItem.id, 'unit_price', Math.round(newSellPrice * 100) / 100);
    }
  };

  // Calculate the effective minimum markup after commission reduction
  const getEffectiveMinimumMarkup = (): number => {
    if (!itemCategory?.minimum_markup) return 0;
    
    const originalMinimumMarkup = itemCategory.minimum_markup;
    const commissionReduction = agentCommissionRate - commissionRate;
    
    return Math.max(0, originalMinimumMarkup - commissionReduction);
  };

  // Update tempDescription when dialog opens or quoteItem changes
  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      setTempDescription(quoteItem.description || quoteItem.item?.description || '');
    }
    setIsDescriptionOpen(open);
  };

  const formatAddressShort = (address: any) => {
    if (!address) return 'No address';
    return `${address.address_type} - ${address.city}, ${address.state}`;
  };

  const handleDescriptionSave = () => {
    try {
      secureTextSchema.parse(tempDescription);
    } catch (error) {
      console.error('Description contains potentially unsafe content');
      return;
    }
    
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

  const currentDescription = quoteItem.description || quoteItem.item?.description || '';

  return (
    <div className="flex items-start gap-2 p-3 border rounded bg-gray-50">
      {/* Drag Handle */}
      <div className="flex items-center justify-center pt-2">
        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-7 gap-2 items-start flex-1">
        {/* Item & Location Column */}
        <div className="col-span-2 space-y-2">
          <Input
            value={quoteItem.name || quoteItem.item?.name || ''}
            onChange={(e) => onUpdateItem(quoteItem.id, 'name', e.target.value)}
            placeholder="Item name"
            className="text-sm font-medium h-8"
          />
          <div className="space-y-1">
            {currentDescription && (
              <SecureHtmlDisplay 
                content={currentDescription}
                className="text-xs text-gray-700 p-2 bg-white border rounded prose prose-xs max-w-none"
                maxLength={200}
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
                  {currentDescription ? 'Edit description' : 'Add description'}
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

        {/* Commission & Markup Control - Always Show */}
        <div className="space-y-1">
          <div className="text-xs text-gray-500 mb-1">
            Commission Rate:
          </div>
          <div className="flex items-center gap-1">
            <Percent className="w-3 h-3 text-blue-600" />
            <Input
              type="number"
              step="0.1"
              min="0"
              max={agentCommissionRate}
              value={commissionRate}
              onChange={(e) => handleCommissionRateChange(parseFloat(e.target.value) || 0)}
              className="text-xs h-8"
              placeholder="Comm %"
            />
          </div>
          <div className="text-xs text-blue-600">
            Rate: {commissionRate.toFixed(1)}%
          </div>
          
          {/* Show markup info only if category has minimum markup */}
          {itemCategory?.minimum_markup && (
            <>
              <div className="text-xs text-gray-500 mb-1">
                Effective Min Markup: {getEffectiveMinimumMarkup().toFixed(1)}%
              </div>
              <div className="text-xs text-orange-600 mb-1">
                Current: {markupCalculation.currentMarkup.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-600">
                Final: {markupCalculation.finalCommissionRate.toFixed(1)}%
              </div>
              {agentCommissionRate - commissionRate > 0 && (
                <div className="text-xs text-red-600">
                  -{(agentCommissionRate - commissionRate).toFixed(1)}% comm reduction
                </div>
              )}
              {!markupCalculation.isValid && (
                <div className="text-xs text-red-600">
                  {markupCalculation.errorMessage}
                </div>
              )}
            </>
          )}
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
