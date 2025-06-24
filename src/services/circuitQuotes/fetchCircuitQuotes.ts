
import { supabase } from "@/integrations/supabase/client";
import type { CircuitQuote } from "@/hooks/useCircuitQuotes/types";

export const fetchCircuitQuotes = async (userId: string | undefined, isAdmin: boolean | undefined) => {
  console.log('[fetchCircuitQuotes] Starting fetch with user:', userId, 'isAdmin:', isAdmin);
  
  // Build the query - admins see all quotes, non-admins see only their own or their agent's clients
  let query = supabase
    .from('circuit_quotes')
    .select(`
      *,
      carrier_quotes (*, display_order),
      circuit_quote_categories (category_name)
    `)
    .order('created_at', { ascending: false });

  // Apply filtering based on user role
  if (isAdmin) {
    console.log('[fetchCircuitQuotes] Admin user - fetching all quotes');
    // No filtering needed for admins
  } else {
    if (!userId) {
      console.log('[fetchCircuitQuotes] Non-admin user without user_id - no quotes to fetch');
      return [];
    }

    // Check if user is associated with an agent
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('associated_agent_id')
      .eq('id', userId)
      .single();

    if (userProfile?.associated_agent_id) {
      console.log('[fetchCircuitQuotes] User is associated with agent:', userProfile.associated_agent_id);
      
      // Get client_info_ids for this agent
      const { data: clientInfos } = await supabase
        .from('client_info')
        .select('id')
        .eq('agent_id', userProfile.associated_agent_id);

      if (clientInfos && clientInfos.length > 0) {
        const clientIds = clientInfos.map(ci => ci.id);
        console.log('[fetchCircuitQuotes] Filtering by agent client_info_ids:', clientIds);
        query = query.in('client_info_id', clientIds);
      } else {
        console.log('[fetchCircuitQuotes] No clients found for agent - returning empty');
        return [];
      }
    } else {
      // Non-admin user without agent - show only their own quotes
      console.log('[fetchCircuitQuotes] Non-admin user without agent - filtering by user_id:', userId);
      query = query.eq('user_id', userId);
    }
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
    deal_registration_id: quote.deal_registration_id, // Include deal registration ID
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
    dhcp: quote.dhcp || false,
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
      static_ip: carrier.static_ip || false,
      display_order: carrier.display_order || 999 // Include display_order with fallback
    }))
  }));

  console.log('[fetchCircuitQuotes] Transformed quotes:', transformedQuotes);
  return transformedQuotes;
};
