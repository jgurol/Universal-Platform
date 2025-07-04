
import { Quote, Client, ClientInfo } from "@/pages/Index";
import { DatabaseQuote } from "@/types/quote";
import { supabase } from "@/integrations/supabase/client";

export const mapQuoteData = async (
  quoteData: any,
  clients: Client[],
  clientInfos: ClientInfo[]
): Promise<Quote> => {
  console.log(`[mapQuoteData] Processing quote ${quoteData.id} with description: "${quoteData.description}"`);
  console.log(`[mapQuoteData] Raw addresses from DB - billing: "${quoteData.billing_address}", service: "${quoteData.service_address}"`);
  console.log(`[mapQuoteData] User ID from database: "${quoteData.user_id}"`);
  
  const client = clients.find(c => c.id === quoteData.client_id);
  const clientInfo = clientInfos.find(ci => ci.id === quoteData.client_info_id);
  
  // Handle null service address properly - don't convert "null" string to actual value
  const serviceAddress = quoteData.service_address === "null" || quoteData.service_address === null ? undefined : quoteData.service_address;
  
  // Fetch accepted_at from quote_acceptances table
  let acceptedAt = null;
  try {
    const { data: acceptanceData } = await supabase
      .from('quote_acceptances')
      .select('accepted_at')
      .eq('quote_id', quoteData.id)
      .maybeSingle();
    
    if (acceptanceData) {
      acceptedAt = acceptanceData.accepted_at;
    }
  } catch (error) {
    console.error('Error fetching acceptance data for quote:', quoteData.id, error);
  }

  const mapped: Quote & { archived?: boolean; user_id?: string; user_profile?: any } = {
    id: quoteData.id,
    user_id: quoteData.user_id, // Ensure user_id is preserved
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
    serviceAddress: serviceAddress, // Properly handle null/undefined service address
    templateId: quoteData.template_id,
    acceptedAt: acceptedAt, // Get from quote_acceptances table
    acceptedBy: quoteData.accepted_by,
    archived: quoteData.archived || false,
    created_at: quoteData.created_at, // Preserve created_at
    updated_at: quoteData.updated_at, // Preserve updated_at
    user_profile: quoteData.user_profile // Preserve the attached user profile data
  };
  
  console.log(`[mapQuoteData] Mapped quote ${quoteData.id} final description: "${mapped.description}"`);
  console.log(`[mapQuoteData] Mapped addresses - billing: "${mapped.billingAddress}", service: "${mapped.serviceAddress}"`);
  console.log(`[mapQuoteData] Mapped user_id: "${mapped.user_id}"`);
  console.log(`[mapQuoteData] Mapped acceptedAt from quote_acceptances: "${mapped.acceptedAt}"`);
  
  return mapped;
};
