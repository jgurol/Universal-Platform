
import { Quote } from "@/types/index";

export const getMRCTotal = (quote: Quote) => {
  if (!quote.quoteItems || quote.quoteItems.length === 0) {
    return 0;
  }
  return quote.quoteItems
    .filter(item => item.charge_type === 'MRC')
    .reduce((total, item) => total + (Number(item.total_price) || 0), 0);
};

export const getNRCTotal = (quote: Quote) => {
  if (!quote.quoteItems || quote.quoteItems.length === 0) {
    return 0;
  }
  return quote.quoteItems
    .filter(item => item.charge_type === 'NRC')
    .reduce((total, item) => total + (Number(item.total_price) || 0), 0);
};

// Helper function to get total quote amount from all items
export const getTotalQuoteAmount = (quote: Quote) => {
  return getMRCTotal(quote) + getNRCTotal(quote);
};
