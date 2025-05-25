
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googlePlacesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

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
    const { input, sessionToken } = await req.json();

    if (!input || input.trim().length < 3) {
      return new Response(JSON.stringify({ predictions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Google Places API (new) Autocomplete
    const response = await fetch(`https://places.googleapis.com/v1/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googlePlacesApiKey,
      },
      body: JSON.stringify({
        input: input.trim(),
        sessionToken: sessionToken,
        includedPrimaryTypes: ['address'],
        languageCode: 'en',
        regionCode: 'US',
      }),
    });

    if (!response.ok) {
      console.error('Google Places API error:', response.status, await response.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch address suggestions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({
      predictions: data.suggestions || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in address-autocomplete function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
