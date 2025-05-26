
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { DatabaseQuote } from "@/types/quote";

export const mapQuoteData = (
  quoteData: any,
  clients: Client[],
  clientInfos: ClientInfo[]
): Quote => {
  console.log(`[mapQuoteData] Processing quote ${quoteData.id} with description: "${quoteData.description}"`);
  console.log(`[mapQuoteData] Raw addresses from DB - billing: "${quoteData.billing_address}", service: "${quoteData.service_address}"`);
  
  const client = clients.find(c => c.id === quoteData.client_id);
  const clientInfo = clientInfos.find(ci => ci.id === quoteData.client_info_id);
  
  const mapped: Quote & { archived?: boolean } = {
    id: quoteData.id,
    clientId: quoteData.client_id || "",
    clientName: client?.name || "Unknown Client",
    companyName: clientInfo?.company_name || client?.companyName || "Unknown Company",
    amount: parseFloat(quoteData.amount || "0"),
    date: quoteData.date,
    description: quoteData.description || "",
    quoteNumber: quoteData.quote_number,
    quoteMonth: quoteData.quote_month,
    quoteYear: quoteData.quote_year,
    status: quoteData.status,
    commission: parseFloat(quoteData.commission || "0"),
    clientInfoId: quoteData.client_info_id,
    clientCompanyName: clientInfo?.company_name,
    commissionOverride: quoteData.commission_override ? parseFloat(quoteData.commission_override) : undefined,
    expiresAt: quoteData.expires_at,
    notes: quoteData.notes,
    quoteItems: quoteData.quote_items || [],
    billingAddress: quoteData.billing_address,
    serviceAddress: quoteData.service_address,
    templateId: quoteData.template_id,
    acceptanceStatus: quoteData.acceptance_status,
    acceptedAt: quoteData.accepted_at,
    acceptedBy: quoteData.accepted_by,
    archived: quoteData.archived || false
  };
  
  console.log(`[mapQuoteData] Mapped quote ${quoteData.id} final description: "${mapped.description}"`);
  console.log(`[mapQuoteData] Mapped addresses - billing: "${mapped.billingAddress}", service: "${mapped.serviceAddress}"`);
  
  return mapped;
};
