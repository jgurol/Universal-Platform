
import { Quote, Client, ClientInfo } from "@/pages/Index";

export const mapQuoteData = (quoteData: any, clients: Client[], clientInfos: ClientInfo[]): Quote => {
  console.log('[mapQuoteData] Raw quote data from database:', {
    id: quoteData.id,
    description: quoteData.description,
    rawQuoteData: quoteData
  });

  const client = clients.find(c => c.id === quoteData.client_id);
  const clientInfo = clientInfos.find(ci => ci.id === quoteData.client_info_id);

  const mappedQuote: Quote = {
    id: quoteData.id,
    clientId: quoteData.client_id,
    clientName: client?.name || 'Unknown Client',
    companyName: client?.companyName || client?.name || 'Unknown Company',
    amount: Number(quoteData.amount),
    date: quoteData.date,
    description: quoteData.description || "", // Explicitly map description
    quoteNumber: quoteData.quote_number,
    quoteMonth: quoteData.quote_month,
    quoteYear: quoteData.quote_year,
    status: quoteData.status || 'pending',
    clientInfoId: quoteData.client_info_id,
    clientCompanyName: clientInfo?.company_name,
    commission: Number(quoteData.commission || 0),
    commissionOverride: quoteData.commission_override ? Number(quoteData.commission_override) : undefined,
    expiresAt: quoteData.expires_at,
    notes: quoteData.notes,
    billingAddress: quoteData.billing_address,
    serviceAddress: quoteData.service_address,
    templateId: quoteData.template_id,
    acceptanceStatus: quoteData.acceptance_status,
    acceptedAt: quoteData.accepted_at,
    acceptedBy: quoteData.accepted_by
  };

  console.log('[mapQuoteData] Mapped quote:', {
    id: mappedQuote.id,
    description: mappedQuote.description,
    status: mappedQuote.status
  });

  return mappedQuote;
};
