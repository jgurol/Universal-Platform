
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
    const { placeId, sessionToken } = await req.json();

    if (!placeId) {
      return new Response(JSON.stringify({ error: 'Place ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Google Places API (new) to get place details
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googlePlacesApiKey,
        'X-Goog-FieldMask': 'id,formattedAddress,addressComponents',
      },
    });

    if (!response.ok) {
      console.error('Google Places API error:', response.status, await response.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch place details' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    // Parse address components
    const addressComponents = data.addressComponents || [];
    const parsedAddress = {
      street_number: '',
      route: '',
      locality: '',
      administrative_area_level_1: '',
      postal_code: '',
      country: '',
    };

    addressComponents.forEach((component: any) => {
      const types = component.types;
      if (types.includes('street_number')) {
        parsedAddress.street_number = component.longText;
      } else if (types.includes('route')) {
        parsedAddress.route = component.longText;
      } else if (types.includes('locality')) {
        parsedAddress.locality = component.longText;
      } else if (types.includes('administrative_area_level_1')) {
        parsedAddress.administrative_area_level_1 = component.shortText;
      } else if (types.includes('postal_code')) {
        parsedAddress.postal_code = component.longText;
      } else if (types.includes('country')) {
        parsedAddress.country = component.longText;
      }
    });

    return new Response(JSON.stringify({
      formattedAddress: data.formattedAddress,
      addressComponents: parsedAddress,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in address-details function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
