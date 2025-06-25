
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentNotificationRequest {
  carrierQuoteId: string;
  circuitQuoteId: string;
  carrier: string;
  price: number;
  clientName: string;
  location: string;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { carrierQuoteId, circuitQuoteId, carrier, price, clientName, location }: AgentNotificationRequest = await req.json();

    // Get the circuit quote details and associated agent
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
      return new Response(JSON.stringify({ error: 'Circuit quote not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if there's an associated agent
    const agent = circuitQuote?.client_info?.agents;
    if (!agent || !agent.email) {
      console.log('No associated agent found for this circuit quote');
      return new Response(JSON.stringify({ message: 'No agent notification needed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

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
            <p><strong>Monthly Cost:</strong> $${price.toFixed(2)}</p>
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

    console.log('Agent notification email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-agent-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
