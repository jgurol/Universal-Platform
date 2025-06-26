
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface AgentNotificationRequest {
  carrierQuoteId: string;
  circuitQuoteId: string;
  carrier: string;
  price: number;
  clientName: string;
  location: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Edge function start ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS preflight request');
      return new Response(null, { 
        status: 200,
        headers: corsHeaders 
      });
    }

    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Processing POST request for agent notification');
    
    // Initialize Supabase and Resend with error handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!resendApiKey) {
      console.error('Missing RESEND_API_KEY environment variable');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    const { carrierQuoteId, circuitQuoteId, carrier, price, clientName, location }: AgentNotificationRequest = parsedBody;
    
    console.log('Parsed request data:', { carrierQuoteId, circuitQuoteId, carrier, price, clientName, location });

    // Validate required fields
    if (!carrierQuoteId || !circuitQuoteId || !carrier || !clientName || !location) {
      console.error('Missing required fields in request');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get the carrier quote details including speed and add-on costs
    console.log('Fetching carrier quote details...');
    const { data: carrierQuote, error: carrierQuoteError } = await supabase
      .from('carrier_quotes')
      .select('*')
      .eq('id', carrierQuoteId)
      .single();

    if (carrierQuoteError) {
      console.error('Error fetching carrier quote:', carrierQuoteError);
      return new Response(JSON.stringify({ error: 'Carrier quote not found', details: carrierQuoteError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get the circuit quote details and associated agent
    console.log('Fetching circuit quote details...');
    const { data: circuitQuote, error: circuitQuoteError } = await supabase
      .from('circuit_quotes')
      .select(`
        *,
        client_info:client_info_id (
          agent_id,
          agents (
            email,
            first_name,
            last_name
          )
        )
      `)
      .eq('id', circuitQuoteId)
      .single();

    if (circuitQuoteError) {
      console.error('Error fetching circuit quote:', circuitQuoteError);
      return new Response(JSON.stringify({ error: 'Circuit quote not found', details: circuitQuoteError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Circuit quote found:', {
      id: circuitQuote?.id,
      client_info: circuitQuote?.client_info,
      has_agent: !!circuitQuote?.client_info?.agents
    });

    // Check if there's an associated agent
    const agent = circuitQuote?.client_info?.agents;
    if (!agent || !agent.email) {
      console.log('No associated agent found for this circuit quote');
      return new Response(JSON.stringify({ message: 'No agent notification needed - no agent found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get the agent's profile to check if they're admin
    console.log('Fetching agent profile...');
    const { data: agentProfile, error: agentProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', agent.email)
      .single();

    const isAdmin = agentProfile?.role === 'admin';
    console.log('Agent admin status:', isAdmin);

    // Get matching category for markup calculation
    console.log('Fetching categories for markup calculation...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }

    // Find matching category for the carrier type
    const matchingCategory = categories?.find(cat => 
      cat.type?.toLowerCase() === carrierQuote.type.toLowerCase() ||
      cat.name.toLowerCase().includes(carrierQuote.type.toLowerCase())
    );

    console.log('Matching category:', matchingCategory);

    // Helper function to extract term months from term string
    const getTermMonths = (term: string | undefined): number => {
      if (!term) return 36; // Default to 36 months if no term specified
      
      const termLower = term.toLowerCase();
      const monthMatch = termLower.match(/(\d+)\s*month/);
      const yearMatch = termLower.match(/(\d+)\s*year/);
      
      if (monthMatch) {
        return parseInt(monthMatch[1]);
      } else if (yearMatch) {
        return parseInt(yearMatch[1]) * 12;
      }
      
      return 36; // Default fallback
    };

    // Calculate the display price with markup and add-ons
    const calculateDisplayPrice = () => {
      const termMonths = getTermMonths(carrierQuote.term);
      
      if (isAdmin) {
        let basePrice = carrierQuote.price;
        
        // Add static IP fees
        if (carrierQuote.static_ip && carrierQuote.static_ip_fee_amount) {
          basePrice += carrierQuote.static_ip_fee_amount;
        }
        if (carrierQuote.static_ip_5 && carrierQuote.static_ip_5_fee_amount) {
          basePrice += carrierQuote.static_ip_5_fee_amount;
        }
        
        // Add amortized install fee (divided by contract term in months)
        if (carrierQuote.install_fee && carrierQuote.install_fee_amount) {
          basePrice += carrierQuote.install_fee_amount / termMonths;
        }
        
        // Add other costs
        if (carrierQuote.other_costs) {
          basePrice += carrierQuote.other_costs;
        }
        
        return basePrice;
      }

      if (matchingCategory && matchingCategory.minimum_markup && matchingCategory.minimum_markup > 0) {
        // Calculate effective minimum markup
        const originalMinimumMarkup = matchingCategory.minimum_markup;
        const effectiveMinimumMarkup = Math.max(0, originalMinimumMarkup);
        
        let basePrice = carrierQuote.price;
        
        // Add static IP fees
        if (carrierQuote.static_ip && carrierQuote.static_ip_fee_amount) {
          basePrice += carrierQuote.static_ip_fee_amount;
        }
        if (carrierQuote.static_ip_5 && carrierQuote.static_ip_5_fee_amount) {
          basePrice += carrierQuote.static_ip_5_fee_amount;
        }
        
        // Add amortized install fee (divided by contract term in months)
        if (carrierQuote.install_fee && carrierQuote.install_fee_amount) {
          basePrice += carrierQuote.install_fee_amount / termMonths;
        }
        
        // Add other costs
        if (carrierQuote.other_costs) {
          basePrice += carrierQuote.other_costs;
        }
        
        // Apply the markup: sell price = cost * (1 + markup/100)
        const markup = effectiveMinimumMarkup / 100;
        return Math.round(basePrice * (1 + markup) * 100) / 100;
      }

      let basePrice = carrierQuote.price;
      
      // Add static IP fees
      if (carrierQuote.static_ip && carrierQuote.static_ip_fee_amount) {
        basePrice += carrierQuote.static_ip_fee_amount;
      }
      if (carrierQuote.static_ip_5 && carrierQuote.static_ip_5_fee_amount) {
        basePrice += carrierQuote.static_ip_5_fee_amount;
      }
      
      // Add amortized install fee (divided by contract term in months)
      if (carrierQuote.install_fee && carrierQuote.install_fee_amount) {
        basePrice += carrierQuote.install_fee_amount / termMonths;
      }
      
      // Add other costs
      if (carrierQuote.other_costs) {
        basePrice += carrierQuote.other_costs;
      }
      
      return basePrice;
    };

    const displayPrice = calculateDisplayPrice();
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(displayPrice);

    console.log('Sending email to agent:', agent.email);

    const platformUrl = 'https://universal.californiatelecom.com/circuit-quotes';
    
    const emailResponse = await resend.emails.send({
      from: 'Universal Platform <noreply@californiatelecom.com>',
      to: [agent.email],
      subject: `New Carrier Quote Price Available - ${clientName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Carrier Quote Price Available</h2>
          
          <p>Hello ${agent.first_name} ${agent.last_name},</p>
          
          <p>A new carrier quote price has been added and is ready for your review:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #666;">Quote Details</h3>
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Carrier:</strong> ${carrier}</p>
            <p><strong>Speed:</strong> ${carrierQuote.speed}</p>
            <p><strong>Monthly Cost:</strong> ${formattedPrice}</p>
            ${carrierQuote.term ? `<p><strong>Term:</strong> ${carrierQuote.term}</p>` : ''}
          </div>
          
          <p>
            <a href="${platformUrl}" 
               style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Quote on Platform
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated notification from the Universal Platform.<br>
            Please log in to review the complete quote details and take any necessary action.
          </p>
        </div>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'Agent notification sent successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('=== Error in send-agent-notification function ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Full error object:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error?.message || "An unexpected error occurred",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
