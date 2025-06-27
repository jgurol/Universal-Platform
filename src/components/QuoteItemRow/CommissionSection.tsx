
import { Input } from "@/components/ui/input";
import { Percent } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { calculateMarkupAndCommission } from "@/services/markupCommissionService";
import { QuoteItemData } from "@/types/quoteItems";

interface CommissionSectionProps {
  quoteItem: QuoteItemData;
  commissionRate: number;
  agentCommissionRate: number;
  isAgentOptedOut: boolean;
  onCommissionRateChange: (newCommissionRate: number) => void;
  getEffectiveMinimumMarkup: () => number;
}

export const CommissionSection = ({ 
  quoteItem,
  commissionRate,
  agentCommissionRate,
  isAgentOptedOut,
  onCommissionRateChange,
  getEffectiveMinimumMarkup
}: CommissionSectionProps) => {
  const { isAdmin } = useAuth();
  const { categories } = useCategories();

  if (isAgentOptedOut) {
    return null;
  }

  const itemCategory = categories.find(cat => cat.id === quoteItem.item?.category_id);
  const cost = quoteItem.cost_override || quoteItem.item?.cost || 0;
  const sellPrice = quoteItem.unit_price || 0;
  
  const markupCalculation = calculateMarkupAndCommission(
    cost,
    sellPrice,
    commissionRate,
    itemCategory,
    agentCommissionRate
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Percent className="w-3 h-3 text-blue-600" />
        <Input
          type="number"
          step="0.1"
          min="0"
          max={agentCommissionRate}
          value={commissionRate}
          onChange={(e) => onCommissionRateChange(parseFloat(e.target.value) || 0)}
          className="text-xs h-8"
          placeholder="Comm %"
        />
      </div>
      
      {!isAdmin && agentCommissionRate - commissionRate > 0 && (
        <div className="text-xs text-red-600">
          -{(agentCommissionRate - commissionRate).toFixed(1)}% price reduction
        </div>
      )}
      
      {isAdmin && itemCategory?.minimum_markup && (
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
          {!markupCalculation.isValid && (
            <div className="text-xs text-red-600">
              {markupCalculation.errorMessage}
            </div>
          )}
        </>
      )}
    </div>
  );
};
