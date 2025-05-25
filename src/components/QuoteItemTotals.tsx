
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

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.total_price, 0);
  };

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="flex justify-between items-center">
        <span className="font-medium">NRC Total:</span>
        <span className="font-bold text-lg">${getNRCTotal().toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium">MRC Total:</span>
        <span className="font-bold text-lg">${getMRCTotal().toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center pt-2 border-t">
        <span className="font-bold">Total Amount:</span>
        <span className="font-bold text-xl">${getTotalAmount().toFixed(2)}</span>
      </div>
    </div>
  );
};
