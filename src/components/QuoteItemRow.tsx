
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { GripVertical } from "lucide-react";
import { QuoteItemData } from "@/types/quoteItems";
import { ClientAddress } from "@/types/clientAddress";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/context/AuthContext";
import { useClients } from "@/hooks/useClients";
import { ItemNameAndDescription } from "./QuoteItemRow/ItemNameAndDescription";
import { AddressSelector } from "./QuoteItemRow/AddressSelector";
import { PriceAndCostSection } from "./QuoteItemRow/PriceAndCostSection";
import { CommissionSection } from "./QuoteItemRow/CommissionSection";
import { TotalAndActions } from "./QuoteItemRow/TotalAndActions";
import { ChargeTypeToggle } from "./QuoteItemRow/ChargeTypeToggle";

interface QuoteItemRowProps {
  quoteItem: QuoteItemData;
  addresses: ClientAddress[];
  onUpdateItem: (itemId: string, field: keyof QuoteItemData, value: number | string) => void;
  onRemoveItem: (itemId: string) => void;
  showHeaders?: boolean;
}

export const QuoteItemRow = ({ quoteItem, addresses, onUpdateItem, onRemoveItem, showHeaders = false }: QuoteItemRowProps) => {
  const { categories } = useCategories();
  const { user, isAdmin } = useAuth();
  const { clients, refetch: refetchClients } = useClients();

  // Force refresh of clients data on component mount to get latest commission rates
  useEffect(() => {
    refetchClients();
  }, [refetchClients]);

  // Get agent commission rate from clients data - match by email instead of ID
  const currentAgent = clients.find(client => client.email === user?.email);
  const agentCommissionRate = currentAgent?.commissionRate || 0; // Default to 0 if not found
  const isAgentOptedOut = agentCommissionRate === 0;

  // Initialize commission rate with agent's rate, but don't use it if opted out
  const [commissionRate, setCommissionRate] = useState<number>(isAgentOptedOut ? 0 : agentCommissionRate);

  // Update commission rate when agent rate changes
  useEffect(() => {
    if (isAgentOptedOut) {
      setCommissionRate(0);
    } else {
      setCommissionRate(agentCommissionRate);
    }
  }, [agentCommissionRate, isAgentOptedOut]);

  // Find the category for this item
  const itemCategory = categories.find(cat => cat.id === quoteItem.item?.category_id);

  // Calculate the commission amount for this line item
  const calculateCommissionAmount = (): number => {
    if (isAgentOptedOut) return 0;
    return (quoteItem.total_price * commissionRate) / 100;
  };

  // Calculate what the minimum sell price would be for 0% commission
  const calculateMinimumSellPrice = (): number => {
    if (isAgentOptedOut) return 0; // No minimum when opted out
    
    const cost = quoteItem.cost_override || quoteItem.item?.cost || 0;
    let minimumSellPrice = cost;
    if (itemCategory?.minimum_markup && cost > 0) {
      minimumSellPrice = cost * (1 + itemCategory.minimum_markup / 100);
    }
    
    // Apply the maximum possible commission reduction (agent's full commission rate)
    const maxCommissionReductionPercentage = agentCommissionRate / 100;
    return minimumSellPrice * (1 - maxCommissionReductionPercentage);
  };

  // Calculate the effective minimum markup after commission reduction
  const getEffectiveMinimumMarkup = (): number => {
    if (!itemCategory?.minimum_markup || isAgentOptedOut) return 0;
    
    const originalMinimumMarkup = itemCategory.minimum_markup;
    const commissionReduction = agentCommissionRate - commissionRate;
    
    return Math.max(0, originalMinimumMarkup - commissionReduction);
  };

  // Handle sell price changes - allow any price if opted out
  const handleSellPriceChange = (newSellPrice: number) => {
    if (isAgentOptedOut) {
      // If agent is opted out, allow any sell price without restrictions
      onUpdateItem(quoteItem.id, 'unit_price', newSellPrice);
      return;
    }
    
    const minimumSellPrice = calculateMinimumSellPrice();
    
    // If the entered price is below minimum, reset to minimum
    if (newSellPrice < minimumSellPrice) {
      onUpdateItem(quoteItem.id, 'unit_price', Math.round(minimumSellPrice * 100) / 100);
      setCommissionRate(0); // At minimum price, commission is 0%
      return;
    }
    
    // Update the sell price
    onUpdateItem(quoteItem.id, 'unit_price', newSellPrice);
    
    // Calculate the new effective commission rate based on the sell price
    const cost = quoteItem.cost_override || quoteItem.item?.cost || 0;
    let basePriceWithMinimumMarkup = cost;
    if (itemCategory?.minimum_markup && cost > 0) {
      basePriceWithMinimumMarkup = cost * (1 + itemCategory.minimum_markup / 100);
    }
    
    if (newSellPrice >= basePriceWithMinimumMarkup) {
      // If sell price is at or above the minimum markup price, cap commission at agent's max rate
      setCommissionRate(Math.min(agentCommissionRate, agentCommissionRate));
    } else {
      // If sell price is below minimum markup price, calculate reduced commission
      const discountPercentage = basePriceWithMinimumMarkup > 0 ? 
        (basePriceWithMinimumMarkup - newSellPrice) / basePriceWithMinimumMarkup : 0;
      
      // Convert discount percentage back to commission reduction
      const commissionReduction = discountPercentage * 100;
      const newCommissionRate = Math.max(0, agentCommissionRate - commissionReduction);
      
      setCommissionRate(newCommissionRate);
    }
  };

  // Handle commission rate change and update sell price accordingly
  const handleCommissionRateChange = (newCommissionRate: number) => {
    if (isAgentOptedOut) return; // Don't allow changes if opted out
    
    // Don't allow commission to go below 0 or above agent's max rate
    const clampedCommissionRate = Math.max(0, Math.min(newCommissionRate, agentCommissionRate));
    
    if (clampedCommissionRate !== newCommissionRate) {
      // If the user tried to go outside bounds, just return without changes
      return;
    }

    setCommissionRate(clampedCommissionRate);

    // Calculate the commission reduction from the agent's maximum rate
    const commissionReduction = agentCommissionRate - clampedCommissionRate;
    const commissionReductionPercentage = commissionReduction / 100; // Convert to decimal

    // Calculate the base price with minimum markup (if category has one)
    const cost = quoteItem.cost_override || quoteItem.item?.cost || 0;
    let basePriceWithMinimumMarkup = cost;
    if (itemCategory?.minimum_markup && cost > 0) {
      basePriceWithMinimumMarkup = cost * (1 + itemCategory.minimum_markup / 100);
    }

    // Apply the commission reduction percentage as a discount from the minimum markup price
    const newSellPrice = basePriceWithMinimumMarkup * (1 - commissionReductionPercentage);
    
    // Update the sell price
    onUpdateItem(quoteItem.id, 'unit_price', Math.round(newSellPrice * 100) / 100);
  };

  const handleAddressChange = (addressId: string) => {
    console.log(`[QuoteItemRow] Address changed for item ${quoteItem.id} to address ${addressId}`);
    onUpdateItem(quoteItem.id, 'address_id', addressId);
  };

  // Determine grid columns based on admin status and commission opt-out
  const getGridColumns = () => {
    if (isAdmin) {
      return isAgentOptedOut ? 'grid-cols-6' : 'grid-cols-7';
    } else {
      return isAgentOptedOut ? 'grid-cols-5' : 'grid-cols-6';
    }
  };

  return (
    <div className="space-y-2">
      {/* Headers Row - Only show if showHeaders is true */}
      {showHeaders && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border rounded font-medium text-sm text-gray-700">
          {/* Drag Handle Space */}
          <div className="w-4"></div>
          
          {/* Main Content Grid Headers */}
          <div className={`grid ${getGridColumns()} gap-2 flex-1`}>
            <div className="col-span-2">Product</div>
            <div>Qty</div>
            <div>Sell</div>
            {!isAgentOptedOut && <div>Commission</div>}
            <div>Extended</div>
            <div>Type</div>
          </div>
        </div>
      )}

      {/* Item Row */}
      <div className="flex items-start gap-2 p-3 border rounded bg-gray-50">
        {/* Drag Handle */}
        <div className="flex items-center justify-center pt-2">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
        </div>

        {/* Main Content Grid */}
        <div className={`grid ${getGridColumns()} gap-2 items-start flex-1`}>
          {/* Item & Location Column */}
          <div className="col-span-2 space-y-2">
            <ItemNameAndDescription
              quoteItem={quoteItem}
              onUpdateItem={onUpdateItem}
            />
            <AddressSelector
              addressId={quoteItem.address_id}
              addresses={addresses}
              onAddressChange={handleAddressChange}
            />
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
          <PriceAndCostSection
            quoteItem={quoteItem}
            onUpdateItem={onUpdateItem}
            onSellPriceChange={handleSellPriceChange}
            isAgentOptedOut={isAgentOptedOut}
            calculateMinimumSellPrice={calculateMinimumSellPrice}
          />

          {/* Commission & Markup Control - Only show if agent is not opted out */}
          <CommissionSection
            quoteItem={quoteItem}
            commissionRate={commissionRate}
            agentCommissionRate={agentCommissionRate}
            isAgentOptedOut={isAgentOptedOut}
            onCommissionRateChange={handleCommissionRateChange}
            getEffectiveMinimumMarkup={getEffectiveMinimumMarkup}
          />

          {/* Total & Commission */}
          <TotalAndActions
            totalPrice={quoteItem.total_price}
            commissionAmount={calculateCommissionAmount()}
            isAgentOptedOut={isAgentOptedOut}
            onRemoveItem={() => onRemoveItem(quoteItem.id)}
          />

          {/* Type Column */}
          <ChargeTypeToggle
            chargeType={quoteItem.charge_type}
            onChargeTypeChange={(checked) => onUpdateItem(quoteItem.id, 'charge_type', checked ? 'MRC' : 'NRC')}
          />
        </div>
      </div>
    </div>
  );
};
