
import { Quote, Client, ClientInfo } from "@/types/index";
import { DatabaseQuote } from "@/types/quote";

export const mapQuoteData = (
  quote: DatabaseQuote | any, 
  clients: Client[], 
  clientInfos: ClientInfo[]
): Quote => {
  const client = quote.client_id ? clients.find(c => c.id === quote.client_id) : null;
  const clientInfo = quote.client_info_id ? clientInfos.find(ci => ci.id === quote.client_info_id) : null;

  console.log(`[mapQuoteData] Mapping quote ${quote.id} - client: ${client?.name}, clientInfo: ${clientInfo?.company_name}`);

  return {
    id: quote.id,
    clientId: quote.client_id || "",
    clientName: client?.name || "No Salesperson Assigned",
    companyName: clientInfo?.company_name || quote.company_name || "",
    amount: Number(quote.amount) || 0,
    date: quote.date,
    description: quote.description || "",
    status: quote.status || "pending",
    clientInfoId: quote.client_info_id,
    clientCompanyName: clientInfo?.company_name || quote.company_name,
    commissionOverride: quote.commission_override ? Number(quote.commission_override) : undefined,
    notes: quote.notes || undefined,
    quoteNumber: quote.quote_number || undefined,
    quoteMonth: quote.quote_month || undefined,
    quoteYear: quote.quote_year || undefined,
    term: quote.term || undefined,
    expiresAt: quote.expires_at || undefined,
    acceptedAt: quote.accepted_at || undefined,
    commission: quote.commission ? Number(quote.commission) : undefined,
    archived: quote.archived || false,
    billingAddress: quote.billing_address || undefined,
    serviceAddress: quote.service_address || undefined,
    templateId: quote.template_id || undefined,
    emailStatus: quote.email_status || undefined,
    acceptanceStatus: quote.acceptance_status || undefined,
    acceptedBy: quote.accepted_by || undefined,
    emailSentAt: quote.email_sent_at || undefined,
    emailOpened: quote.email_opened || false,
    emailOpenedAt: quote.email_opened_at || undefined,
    emailOpenCount: quote.email_open_count || 0,
    user_id: quote.user_id,
    // Note: quoteItems will be set by the calling function after this mapping
    quoteItems: []
  };
};
