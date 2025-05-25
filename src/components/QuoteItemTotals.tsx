
import { QuoteItemData } from "@/types/quoteItems";

interface QuoteItemTotalsProps {
  items: QuoteItemData[];
}

export const QuoteItemTotals = ({ items }: QuoteItemTotalsProps) => {
  const getMRCTotal = () => {
    return items
      .filter(item => item.charge_type === 'MRC')
      .reduce((total, item) => total + item.total_price, 0);
  };

  const getNRCTotal = () => {
    return items
      .filter(item => item.charge_type === 'NRC')
      .reduce((total, item) => total + item.total_price, 0);
  };

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex justify-between items-center">
        <span className="font-medium text-lg">Total One-Time (NRC):</span>
        <span className="font-bold text-xl">${getNRCTotal().toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-lg">Total Recurring (MRC):</span>
        <span className="font-bold text-xl">${getMRCTotal().toFixed(2)}</span>
      </div>
    </div>
  );
};
