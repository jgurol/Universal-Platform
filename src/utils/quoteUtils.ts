
import { Quote, Client, ClientInfo } from "@/pages/Index";

export const mapQuoteData = (quoteData: any, clients: Client[], clientInfos: ClientInfo[]): Quote => {
  console.log(`[mapQuoteData] Processing quote ${quoteData.id} with description: "${quoteData.description}"`);
  
  const client = clients.find(c => c.id === quoteData.client_id);
  const clientInfo = clientInfos.find(c => c.id === quoteData.client_info_id);

  // Transform quote items if they exist
  const quoteItems = quoteData.quote_items?.map((item: any) => ({
    id: item.id,
    item_id: item.item_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    charge_type: item.charge_type || 'NRC',
    address_id: item.address_id,
    name: item.item?.name || '',
    description: item.item?.description || '',
    item: item.item,
    address: item.address
  })) || [];

  const mappedQuote: Quote = {
    id: quoteData.id,
    clientId: quoteData.client_id || "",
    clientName: client?.name || "Unknown Client",
    companyName: client?.companyName || clientInfo?.company_name || client?.name || "Unknown Company",
    amount: Number(quoteData.amount) || 0,
    date: quoteData.date,
    description: quoteData.description || "", // Ensure description is preserved
    quoteNumber: quoteData.quote_number,
    quoteMonth: quoteData.quote_month,
    quoteYear: quoteData.quote_year,
    status: quoteData.status || "pending",
    commission: Number(quoteData.commission) || 0,
    clientInfoId: quoteData.client_info_id,
    clientCompanyName: clientInfo?.company_name,
    commissionOverride: quoteData.commission_override ? Number(quoteData.commission_override) : undefined,
    expiresAt: quoteData.expires_at,
    notes: quoteData.notes,
    quoteItems: quoteItems,
    billingAddress: quoteData.billing_address,
    serviceAddress: quoteData.service_address,
    templateId: quoteData.template_id
  };

  console.log(`[mapQuoteData] Mapped quote ${quoteData.id} final description: "${mappedQuote.description}"`);
  
  return mappedQuote;
};
