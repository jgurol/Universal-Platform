
import { QuoteItemData } from "@/types/quoteItems";

export const calculateTotalsByChargeType = (items: QuoteItemData[]) => {
  const mrcTotal = items
    .filter(item => item.charge_type === 'MRC')
    .reduce((sum, item) => sum + item.total_price, 0);
  
  const nrcTotal = items
    .filter(item => item.charge_type === 'NRC')
    .reduce((sum, item) => sum + item.total_price, 0);
  
  const totalAmount = mrcTotal + nrcTotal;
  
  return { mrcTotal, nrcTotal, totalAmount };
};
