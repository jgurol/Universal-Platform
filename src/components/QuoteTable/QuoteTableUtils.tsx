
import { Quote } from "@/types/index";

export const getMRCTotal = (quote: Quote) => {
  console.log(`[getMRCTotal] Processing quote ${quote.id} with ${quote.quoteItems?.length || 0} items`);
  
  if (!quote.quoteItems || quote.quoteItems.length === 0) {
    console.log(`[getMRCTotal] No quote items found for quote ${quote.id}`);
    return 0;
  }
  
  const mrcItems = quote.quoteItems.filter(item => {
    const isMRC = item.charge_type === 'MRC';
    console.log(`[getMRCTotal] Item "${item.name}" charge_type: "${item.charge_type}", is MRC: ${isMRC}`);
    return isMRC;
  });
  
  const total = mrcItems.reduce((total, item) => {
    const itemTotal = Number(item.total_price) || 0;
    console.log(`[getMRCTotal] MRC item: ${item.name}, total_price: ${itemTotal}`);
    return total + itemTotal;
  }, 0);
  
  console.log(`[getMRCTotal] Quote ${quote.id} MRC total: ${total} from ${mrcItems.length} MRC items`);
  return total;
};

export const getNRCTotal = (quote: Quote) => {
  console.log(`[getNRCTotal] Processing quote ${quote.id} with ${quote.quoteItems?.length || 0} items`);
  
  if (!quote.quoteItems || quote.quoteItems.length === 0) {
    console.log(`[getNRCTotal] No quote items found for quote ${quote.id}`);
    return 0;
  }
  
  const nrcItems = quote.quoteItems.filter(item => {
    const isNRC = item.charge_type === 'NRC';
    console.log(`[getNRCTotal] Item "${item.name}" charge_type: "${item.charge_type}", is NRC: ${isNRC}`);
    return isNRC;
  });
  
  const total = nrcItems.reduce((total, item) => {
    const itemTotal = Number(item.total_price) || 0;
    console.log(`[getNRCTotal] NRC item: ${item.name}, total_price: ${itemTotal}`);
    return total + itemTotal;
  }, 0);
  
  console.log(`[getNRCTotal] Quote ${quote.id} NRC total: ${total} from ${nrcItems.length} NRC items`);
  return total;
};

// Helper function to get total quote amount from all items
export const getTotalQuoteAmount = (quote: Quote) => {
  const mrcTotal = getMRCTotal(quote);
  const nrcTotal = getNRCTotal(quote);
  const total = mrcTotal + nrcTotal;
  
  console.log(`[getTotalQuoteAmount] Quote ${quote.id} - MRC: ${mrcTotal}, NRC: ${nrcTotal}, Total: ${total}`);
  return total;
};
