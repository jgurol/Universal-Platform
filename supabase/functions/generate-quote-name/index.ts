import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { clientName, items } = await req.json();

    if (!clientName || !items || items.length === 0) {
      return new Response(JSON.stringify({ quoteName: `Quote for ${clientName || 'Client'}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a summary of items for the AI prompt
    const itemsSummary = items.map((item: any) => {
      const name = item.name || item.item?.name || 'Unknown Item';
      const quantity = item.quantity || 1;
      const chargeType = item.charge_type || item.item?.charge_type || 'MRC';
      return `${quantity}x ${name} (${chargeType})`;
    }).join(', ');

    const prompt = `Create a concise, professional quote name (max 60 characters) for a telecommunications/business services quote.

Client: ${clientName}
Items: ${itemsSummary}

Requirements:
- Include client name
- Summarize the main services/products
- Keep it professional and clear
- Max 60 characters
- Focus on the most important items if there are many

Examples:
- "Acme Corp - Fiber Internet & Phone Services"
- "TechStart LLC - Dedicated Bandwidth Solution"
- "Regional Bank - Multi-Location Connectivity"

Generate only the quote name, nothing else:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const generatedName = data.choices[0].message.content.trim();
    
    // Clean up the generated name - remove quotes if present
    const quoteName = generatedName.replace(/^["']|["']$/g, '').slice(0, 60);

    return new Response(JSON.stringify({ quoteName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-quote-name function:', error);
    
    // Fallback to simple name generation
    const { clientName } = await req.json().catch(() => ({}));
    const fallbackName = `Quote for ${clientName || 'Client'}`;
    
    return new Response(JSON.stringify({ quoteName: fallbackName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});