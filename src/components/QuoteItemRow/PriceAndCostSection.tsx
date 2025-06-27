
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { QuoteItemData } from "@/types/quoteItems";
import { useAuth } from "@/context/AuthContext";

interface PriceAndCostSectionProps {
  quoteItem: QuoteItemData;
  onUpdateItem: (itemId: string, field: keyof QuoteItemData, value: number | string) => void;
  onSellPriceChange: (newSellPrice: number) => void;
  isAgentOptedOut: boolean;
  calculateMinimumSellPrice: () => number;
}

export const PriceAndCostSection = ({ 
  quoteItem, 
  onUpdateItem, 
  onSellPriceChange,
  isAgentOptedOut,
  calculateMinimumSellPrice
}: PriceAndCostSectionProps) => {
  const [tempSellPrice, setTempSellPrice] = useState<string>(quoteItem.unit_price.toString());
  const { isAdmin } = useAuth();

  useEffect(() => {
    setTempSellPrice(quoteItem.unit_price.toString());
  }, [quoteItem.unit_price]);

  const cost = quoteItem.cost_override || quoteItem.item?.cost || 0;
  const sellPrice = quoteItem.unit_price || 0;

  const calculateProfitMargin = (): string => {
    if (!isAdmin || cost === 0) return '0%';
    
    const margin = ((sellPrice - cost) / cost) * 100;
    return `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%`;
  };

  const calculateDollarProfit = (): string => {
    if (!isAdmin) return '$0.00';
    
    const profit = sellPrice - cost;
    return `${profit >= 0 ? '+' : ''}$${Math.abs(profit).toFixed(2)}`;
  };

  const getProfitMarginColor = (): string => {
    if (!isAdmin || cost === 0) return 'text-gray-500';
    
    const margin = ((sellPrice - cost) / cost) * 100;
    
    if (margin > 20) return 'text-green-600';
    if (margin > 0) return 'text-blue-600';
    if (margin === 0) return 'text-gray-500';
    return 'text-red-600';
  };

  const handleSellPriceInputChange = (value: string) => {
    setTempSellPrice(value);
    
    if (value && !isNaN(parseFloat(value))) {
      const numericValue = parseFloat(value);
      onSellPriceChange(numericValue);
    }
  };

  const handleSellPriceBlur = () => {
    const numericValue = parseFloat(tempSellPrice);
    
    if (!tempSellPrice || isNaN(numericValue)) {
      setTempSellPrice(quoteItem.unit_price.toString());
      return;
    }
    
    if (isAgentOptedOut) {
      return;
    }
    
    const minimumSellPrice = calculateMinimumSellPrice();
    
    if (numericValue < minimumSellPrice) {
      const roundedMin = Math.round(minimumSellPrice * 100) / 100;
      setTempSellPrice(roundedMin.toString());
      onSellPriceChange(roundedMin);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.01"
          value={tempSellPrice}
          onChange={(e) => handleSellPriceInputChange(e.target.value)}
          onBlur={handleSellPriceBlur}
          className="text-xs h-8"
          placeholder="$"
        />
      </div>
      {isAdmin && (
        <>
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
          <div className="flex flex-col items-center justify-center space-y-1">
            <span className={`text-xs font-medium ${getProfitMarginColor()}`}>
              {calculateProfitMargin()}
            </span>
            <span className={`text-xs font-medium ${getProfitMarginColor()}`}>
              {calculateDollarProfit()}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
