
import { supabase } from "@/integrations/supabase/client";
import type { CircuitQuote } from "@/hooks/useCircuitQuotes/types";

export const fetchCircuitQuotes = async (userId: string | undefined, isAdmin: boolean | undefined) => {
  console.log('[fetchCircuitQuotes] Starting fetch with user:', userId, 'isAdmin:', isAdmin);
  
  // Build the query - admins see all quotes, non-admins see only their own
  let query = supabase
    .from('circuit_quotes')
    .select(`
      *,
      carrier_quotes (*),
      circuit_quote_categories (category_name)
    `)
    .order('created_at', { ascending: false });

  // Only filter by user_id for non-admin users
  if (!isAdmin) {
    if (!userId) {
      console.log('[fetchCircuitQuotes] Non-admin user without user_id - no quotes to fetch');
      return [];
    }
    query = query.eq('user_id', userId);
    console.log('[fetchCircuitQuotes] Non-admin user - filtering by user_id:', userId);
  } else {
    console.log('[fetchCircuitQuotes] Admin user - fetching all quotes');
  }

  console.log('[fetchCircuitQuotes] Executing query...');
  const { data: circuitQuotes, error: quotesError } = await query;

  if (quotesError) {
    console.error('[fetchCircuitQuotes] Error fetching circuit quotes:', quotesError);
    throw quotesError;
  }

  console.log('[fetchCircuitQuotes] Query result:', circuitQuotes);
  console.log('[fetchCircuitQuotes] Number of quotes fetched:', circuitQuotes?.length || 0);

  // Transform data to match the expected format
  const transformedQuotes: CircuitQuote[] = (circuitQuotes || []).map(quote => ({
    id: quote.id,
    client_name: quote.client_name,
    client_info_id: quote.client_info_id,
    location: quote.location,
    suite: quote.suite || '',
    created_at: new Date(quote.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    status: quote.status as 'new_pricing' | 'researching' | 'completed' | 'sent_to_customer',
    static_ip: quote.static_ip || false,
    slash_29: quote.slash_29 || false,
    mikrotik_required: quote.mikrotik_required || false,
    user_id: quote.user_id, // Include user_id for creator identification
    categories: (quote.circuit_quote_categories || []).map((cat: any) => cat.category_name),
    carriers: (quote.carrier_quotes || []).map((carrier: any) => ({
      id: carrier.id,
      circuit_quote_id: carrier.circuit_quote_id,
      carrier: carrier.carrier,
      type: carrier.type,
      speed: carrier.speed,
      price: carrier.price,
      notes: carrier.notes || '',
      term: carrier.term || '',
      color: carrier.color,
      install_fee: carrier.install_fee || false,
      site_survey_needed: carrier.site_survey_needed || false,
      no_service: carrier.no_service || false,
      static_ip: carrier.static_ip || false
    }))
  }));

  console.log('[fetchCircuitQuotes] Transformed quotes:', transformedQuotes);
  return transformedQuotes;
};
