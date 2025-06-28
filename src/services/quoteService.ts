
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "@/pages/Index";
import type { Database } from "@/integrations/supabase/types";

type DatabaseQuote = Database['public']['Tables']['quotes']['Row'];

const mapDatabaseQuoteToQuote = (dbQuote: DatabaseQuote, clientName?: string, companyName?: string): Quote => {
  console.log('[mapDatabaseQuoteToQuote] Mapping quote with term:', {
    id: dbQuote.id,
    rawTerm: dbQuote.term,
    termType: typeof dbQuote.term
  });

  const mappedQuote = {
    id: dbQuote.id,
    clientId: dbQuote.client_id || "",
    clientName: clientName || "No Salesperson Assigned",
    companyName: companyName || "Unknown Company",
    amount: Number(dbQuote.amount),
    date: dbQuote.date,
    description: dbQuote.description || "",
    status: dbQuote.status || "pending",
    clientInfoId: dbQuote.client_info_id || undefined,
    clientCompanyName: companyName,
    commissionOverride: dbQuote.commission_override ? Number(dbQuote.commission_override) : undefined,
    notes: dbQuote.notes || undefined,
    quoteNumber: dbQuote.quote_number || undefined,
    quoteMonth: dbQuote.quote_month || undefined,
    quoteYear: dbQuote.quote_year || undefined,
    expiresAt: dbQuote.expires_at || undefined,
    acceptedAt: dbQuote.accepted_at || undefined,
    commission: dbQuote.commission ? Number(dbQuote.commission) : undefined,
    archived: dbQuote.archived || false,
    billingAddress: dbQuote.billing_address || undefined,
    serviceAddress: dbQuote.service_address || undefined,
    templateId: dbQuote.template_id || undefined,
    emailStatus: dbQuote.email_status || undefined,
    acceptedBy: dbQuote.accepted_by || undefined,
    emailSentAt: dbQuote.email_sent_at || undefined,
    emailOpened: dbQuote.email_opened || false,
    emailOpenedAt: dbQuote.email_opened_at || undefined,
    emailOpenCount: dbQuote.email_open_count || 0,
    term: dbQuote.term || undefined, // Ensure term is properly mapped
    user_id: dbQuote.user_id
  };

  console.log('[mapDatabaseQuoteToQuote] Final mapped quote with term:', {
    id: mappedQuote.id,
    term: mappedQuote.term,
    termType: typeof mappedQuote.term
  });

  return mappedQuote;
};

export const fetchQuotes = async (userId: string): Promise<Quote[]> => {
  console.log('[fetchQuotes] Fetching quotes for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        agents!quotes_client_id_fkey(first_name, last_name),
        client_info!quotes_client_info_id_fkey(company_name)
      `)
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchQuotes] Error fetching quotes:', error);
      throw error;
    }

    const quotes = data?.map(dbQuote => {
      const agent = dbQuote.agents as any;
      const clientInfo = dbQuote.client_info as any;
      const clientName = agent ? `${agent.first_name} ${agent.last_name}` : undefined;
      const companyName = clientInfo?.company_name;
      
      console.log('[fetchQuotes] Processing quote:', {
        id: dbQuote.id,
        rawTerm: dbQuote.term,
        termType: typeof dbQuote.term,
        description: dbQuote.description,
        hasTermProperty: dbQuote.hasOwnProperty('term')
      });
      
      const mappedQuote = mapDatabaseQuoteToQuote(dbQuote, clientName, companyName);
      
      console.log('[fetchQuotes] Final quote result:', {
        id: mappedQuote.id,
        mappedTerm: mappedQuote.term,
        mappedTermType: typeof mappedQuote.term
      });
      
      return mappedQuote;
    }) || [];

    console.log('[fetchQuotes] Successfully fetched quotes:', quotes.length);
    console.log('[fetchQuotes] Sample quote terms:', quotes.slice(0, 3).map(q => ({ id: q.id, term: q.term })));
    
    return quotes;
  } catch (error) {
    console.error('[fetchQuotes] Error in fetchQuotes:', error);
    throw error;
  }
};

export const updateQuote = async (quote: Quote): Promise<void> => {
  console.log('[updateQuote] Updating quote:', {
    id: quote.id,
    term: quote.term,
    description: quote.description,
    billingAddress: quote.billingAddress,
    serviceAddress: quote.serviceAddress
  });

  try {
    const { error } = await supabase
      .from('quotes')
      .update({
        client_id: quote.clientId || null,
        client_info_id: quote.clientInfoId || null,
        amount: quote.amount,
        date: quote.date,
        description: quote.description,
        quote_number: quote.quoteNumber,
        quote_month: quote.quoteMonth,
        quote_year: quote.quoteYear,
        status: quote.status,
        commission_override: quote.commissionOverride,
        expires_at: quote.expiresAt,
        notes: quote.notes,
        term: quote.term, // Make sure term is included in updates
        billing_address: quote.billingAddress,
        service_address: quote.serviceAddress,
        template_id: quote.templateId,
        updated_at: new Date().toISOString()
      })
      .eq('id', quote.id);

    if (error) {
      console.error('[updateQuote] Error updating quote:', error);
      throw error;
    }

    console.log('[updateQuote] Quote updated successfully');
  } catch (error) {
    console.error('[updateQuote] Error in updateQuote:', error);
    throw error;
  }
};

export const deleteQuote = async (quoteId: string): Promise<void> => {
  console.log('[deleteQuote] Archiving quote:', quoteId);
  
  try {
    const { error } = await supabase.rpc('delete_quote', {
      quote_id: quoteId
    });

    if (error) {
      console.error('[deleteQuote] Error archiving quote:', error);
      throw error;
    }

    console.log('[deleteQuote] Quote archived successfully');
  } catch (error) {
    console.error('[deleteQuote] Error in deleteQuote:', error);
    throw error;
  }
};
