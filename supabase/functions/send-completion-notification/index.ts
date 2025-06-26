import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface CompletionNotificationRequest {
  circuitQuoteId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Completion notification function start ===');
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

    console.log('Processing POST request for completion notification');
    
    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

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

    if (!openaiApiKey) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
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
    
    const { circuitQuoteId }: CompletionNotificationRequest = parsedBody;
    
    console.log('Parsed request data:', { circuitQuoteId });

    if (!circuitQuoteId) {
      console.error('Missing circuitQuoteId in request');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get the circuit quote details with all carriers and deal info
    console.log('Fetching circuit quote details with carriers and deal info...');
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
        ),
        deal_registration:deal_registration_id (
          deal_name,
          description,
          notes,
          deal_value
        ),
        carrier_quotes (*)
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
      has_agent: !!circuitQuote?.client_info?.agents,
      carriers_count: circuitQuote?.carrier_quotes?.length || 0
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

    // Get categories for markup calculation
    console.log('Fetching categories for pricing calculation...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }

    // Get agent's profile to check if they're admin
    console.log('Fetching agent profile...');
    const { data: agentProfile, error: agentProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', agent.email)
      .single();

    const isAdmin = agentProfile?.role === 'admin';
    console.log('Agent admin status:', isAdmin);

    // Helper function to calculate display price with markup
    const calculateDisplayPrice = (carrierQuote: any) => {
      const getTermMonths = (term: string | undefined): number => {
        if (!term) return 36;
        const termLower = term.toLowerCase();
        const monthMatch = termLower.match(/(\d+)\s*month/);
        const yearMatch = termLower.match(/(\d+)\s*year/);
        
        if (monthMatch) {
          return parseInt(monthMatch[1]);
        } else if (yearMatch) {
          return parseInt(yearMatch[1]) * 12;
        }
        
        return 36;
      };

      const termMonths = getTermMonths(carrierQuote.term);
      
      if (isAdmin) {
        let basePrice = carrierQuote.price;
        
        if (carrierQuote.static_ip && carrierQuote.static_ip_fee_amount) {
          basePrice += carrierQuote.static_ip_fee_amount;
        }
        if (carrierQuote.static_ip_5 && carrierQuote.static_ip_5_fee_amount) {
          basePrice += carrierQuote.static_ip_5_fee_amount;
        }
        if (carrierQuote.install_fee && carrierQuote.install_fee_amount) {
          basePrice += carrierQuote.install_fee_amount / termMonths;
        }
        if (carrierQuote.other_costs) {
          basePrice += carrierQuote.other_costs;
        }
        
        return basePrice;
      }

      const matchingCategory = categories?.find(cat => 
        cat.type?.toLowerCase() === carrierQuote.type.toLowerCase() ||
        cat.name.toLowerCase().includes(carrierQuote.type.toLowerCase())
      );

      if (matchingCategory && matchingCategory.minimum_markup && matchingCategory.minimum_markup > 0) {
        const effectiveMinimumMarkup = Math.max(0, matchingCategory.minimum_markup);
        
        let basePrice = carrierQuote.price;
        
        if (carrierQuote.static_ip && carrierQuote.static_ip_fee_amount) {
          basePrice += carrierQuote.static_ip_fee_amount;
        }
        if (carrierQuote.static_ip_5 && carrierQuote.static_ip_5_fee_amount) {
          basePrice += carrierQuote.static_ip_5_fee_amount;
        }
        if (carrierQuote.install_fee && carrierQuote.install_fee_amount) {
          basePrice += carrierQuote.install_fee_amount / termMonths;
        }
        if (carrierQuote.other_costs) {
          basePrice += carrierQuote.other_costs;
        }
        
        const markup = effectiveMinimumMarkup / 100;
        return Math.round(basePrice * (1 + markup) * 100) / 100;
      }

      let basePrice = carrierQuote.price;
      
      if (carrierQuote.static_ip && carrierQuote.static_ip_fee_amount) {
        basePrice += carrierQuote.static_ip_fee_amount;
      }
      if (carrierQuote.static_ip_5 && carrierQuote.static_ip_5_fee_amount) {
        basePrice += carrierQuote.static_ip_5_fee_amount;
      }
      if (carrierQuote.install_fee && carrierQuote.install_fee_amount) {
        basePrice += carrierQuote.install_fee_amount / termMonths;
      }
      if (carrierQuote.other_costs) {
        basePrice += carrierQuote.other_costs;
      }
      
      return basePrice;
    };

    // Helper function to get site survey status
    const getSiteSurveyStatus = (carrier: any) => {
      if (!carrier.site_survey_needed) {
        return {
          text: '',
          color: '',
          bgColor: ''
        };
      }
      
      // Extract site survey color from notes if present
      let surveyColor = 'red'; // default
      if (carrier.notes && carrier.notes.includes("Site Survey:")) {
        const parts = carrier.notes.split("Site Survey:");
        if (parts.length > 1) {
          const colorPart = parts[1].trim().toLowerCase();
          if (colorPart.startsWith("red") || colorPart.startsWith("yellow") || colorPart.startsWith("orange") || colorPart.startsWith("green")) {
            surveyColor = colorPart.split(" ")[0];
          }
        }
      }
      
      switch (surveyColor.toLowerCase()) {
        case 'red':
          return {
            text: 'Construction needed',
            color: '#dc2626', // red
            bgColor: '#fef2f2'
          };
        case 'orange':
          return {
            text: 'Construction likely',
            color: '#ea580c', // orange
            bgColor: '#fff7ed'
          };
        case 'yellow':
          return {
            text: 'Possible Construction',
            color: '#ca8a04', // yellow
            bgColor: '#fefce8'
          };
        case 'green':
          return {
            text: 'No Construction',
            color: '#16a34a', // green
            bgColor: '#f0fdf4'
          };
        default:
          return {
            text: 'Construction needed',
            color: '#dc2626', // red
            bgColor: '#fef2f2'
          };
      }
    };

    // Prepare carrier data for AI analysis and email display
    const carriersData = circuitQuote.carrier_quotes
      .filter((carrier: any) => !carrier.no_service)
      .map((carrier: any) => ({
        carrier: carrier.carrier,
        type: carrier.type,
        speed: carrier.speed,
        price: calculateDisplayPrice(carrier),
        term: carrier.term,
        notes: carrier.notes,
        install_fee: carrier.install_fee,
        install_fee_amount: carrier.install_fee_amount,
        site_survey_needed: carrier.site_survey_needed,
        static_ip: carrier.static_ip,
        static_ip_fee_amount: carrier.static_ip_fee_amount,
        site_survey_status: getSiteSurveyStatus(carrier)
      }))
      .sort((a, b) => {
        // First sort by carrier name alphabetically
        const carrierComparison = a.carrier.localeCompare(b.carrier);
        if (carrierComparison !== 0) {
          return carrierComparison;
        }
        // Then sort by price (lowest to highest)
        return a.price - b.price;
      });

    console.log('Processed carriers data for AI:', carriersData.length);

    // Check for site survey requirements
    const siteSurveyRequired = carriersData.some(carrier => carrier.site_survey_needed);

    // Generate AI explanation
    let aiExplanation = "Unable to generate AI explanation at this time.";
    
    if (carriersData.length > 0) {
      try {
        const dealInfo = circuitQuote.deal_registration || {};
        const prompt = `
As a telecom expert, explain the differences between these circuit options for this client location:

Location: ${circuitQuote.location}
Available Circuit Options:
${carriersData.map((carrier, index) => `
${index + 1}. ${carrier.carrier} - ${carrier.type} - ${carrier.speed} - $${carrier.price}/mo - ${carrier.term || 'N/A'}
`).join('')}

Write a single comprehensive paragraph that explains the key differences between the carriers, circuit types (fiber vs cable vs copper etc.), speed offerings, and pricing variations. Focus on technical differences and what makes each option unique. Keep it educational and informative without making specific recommendations.
        `;

        console.log('Sending request to OpenAI...');
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a telecom expert who provides clear, educational explanations about circuit technologies and carrier differences. Write in a professional, informative tone.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 600
          }),
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          let rawExplanation = openaiData.choices[0]?.message?.content || aiExplanation;
          
          // Format the AI response for HTML email with proper line breaks and paragraph spacing
          aiExplanation = rawExplanation
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => `<p style="margin: 0 0 12px 0; line-height: 1.6;">${line}</p>`)
            .join('');
          
          console.log('AI explanation generated successfully');
        } else {
          console.error('OpenAI API error:', await openaiResponse.text());
        }
      } catch (aiError) {
        console.error('Error generating AI explanation:', aiError);
      }
    }

    // Format carriers list for email with site survey column - sorted by carrier then price
    const carriersListHtml = carriersData.map(carrier => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${carrier.carrier}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${carrier.type}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${carrier.speed}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">$${carrier.price.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${carrier.term || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; ${carrier.site_survey_status.bgColor ? `background-color: ${carrier.site_survey_status.bgColor}; color: ${carrier.site_survey_status.color}; font-weight: bold;` : ''}">
          ${carrier.site_survey_status.text}
        </td>
      </tr>
    `).join('');

    console.log('Sending completion email to agent:', agent.email);

    const platformUrl = 'https://universal.californiatelecom.com/circuit-quotes';
    
    // Create site survey warning section if needed
    const siteSurveyWarningHtml = siteSurveyRequired ? `
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h3 style="margin-top: 0; color: #92400e;">⚠️ Site Survey Required</h3>
        <p style="color: #92400e; margin: 0; line-height: 1.6;">
          One or more circuit options require a site survey. This may result in additional construction costs and extended installation timelines. Please factor this into your planning and customer expectations.
        </p>
      </div>
    ` : '';
    
    const emailResponse = await resend.emails.send({
      from: 'Universal Platform <noreply@californiatelecom.com>',
      to: [agent.email],
      subject: `Circuit Pricing Complete - ${circuitQuote.client_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #333;">Circuit Pricing Complete</h2>
          
          <p>Hello ${agent.first_name} ${agent.last_name},</p>
          
          <p>We have completed pricing all circuits for your client and are ready for your review:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #666;">Client Details</h3>
            <p><strong>Client:</strong> ${circuitQuote.client_name}</p>
            <p><strong>Location:</strong> ${circuitQuote.location}</p>
            ${circuitQuote.suite ? `<p><strong>Suite:</strong> ${circuitQuote.suite}</p>` : ''}
            ${circuitQuote.deal_registration?.deal_name ? `<p><strong>Deal:</strong> ${circuitQuote.deal_registration.deal_name}</p>` : ''}
          </div>

          ${siteSurveyWarningHtml}

          <h3 style="color: #333;">Available Circuit Options</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Carrier</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Type</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Speed</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Monthly Price</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Term</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Site Survey</th>
              </tr>
            </thead>
            <tbody>
              ${carriersListHtml}
            </tbody>
          </table>

          <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #1e40af;">Circuit Technology Explanation</h3>
            <div style="color: #374151;">${aiExplanation}</div>
          </div>
          
          <p>
            <a href="${platformUrl}" 
               style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Details on Platform
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated notification from the Universal Platform.<br>
            All pricing includes applicable markups and add-on costs.
          </p>
        </div>
      `,
    });

    console.log('Completion email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'Completion notification sent successfully',
      carriersAnalyzed: carriersData.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('=== Error in send-completion-notification function ===');
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
