
import { Client, ClientInfo } from "@/pages/Index";

export const calculateQuoteTotals = (quoteItems: any[]) => {
  const allItems = quoteItems || [];
  
  const nrcItems = [];
  const mrcItems = [];
  
  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    
    if (item.charge_type === 'NRC') {
      nrcItems.push(item);
    } else if (item.charge_type === 'MRC') {
      mrcItems.push(item);
    }
  }
  
  const nrcTotal = nrcItems.reduce((total, item) => {
    const itemTotal = Number(item.total_price) || 0;
    return total + itemTotal;
  }, 0);
  
  const mrcTotal = mrcItems.reduce((total, item) => {
    const itemTotal = Number(item.total_price) || 0;
    return total + itemTotal;
  }, 0);
  
  const totalAmount = nrcTotal + mrcTotal;

  return { nrcTotal, mrcTotal, totalAmount };
};

export const mapQuoteData = (quote: any, clients: Client[], clientInfos: ClientInfo[]) => {
  const { nrcTotal, mrcTotal, totalAmount } = calculateQuoteTotals(quote.quote_items);

  return {
    id: quote.id,
    clientId: quote.client_id || '',
    clientName: clients.find(c => c.id === quote.client_id)?.name || 'Unknown',
    companyName: clients.find(c => c.id === quote.client_id)?.companyName || clients.find(c => c.id === quote.client_id)?.name || 'Unknown',
    amount: totalAmount,
    date: quote.date,
    description: quote.description || '',
    quoteNumber: quote.quote_number || undefined,
    quoteMonth: quote.quote_month || undefined,
    quoteYear: quote.quote_year || undefined,
    status: quote.status || 'pending',
    commission: quote.commission || 0,
    clientInfoId: quote.client_info_id || undefined,
    clientCompanyName: clientInfos.find(ci => ci.id === quote.client_info_id)?.company_name,
    commissionOverride: quote.commission_override || undefined,
    expiresAt: quote.expires_at || undefined,
    notes: quote.notes || undefined,
    quoteItems: quote.quote_items || []
  };
};
