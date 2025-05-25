
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Create a Supabase client with service role key for database writes
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const quoteId = url.searchParams.get("quote");

    if (!quoteId) {
      console.log("No quote ID provided in tracking request");
      return new Response("Invalid request", { status: 400 });
    }

    console.log(`Email opened for quote: ${quoteId}`);

    // Get current quote data
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('email_open_count, email_opened')
      .eq('id', quoteId)
      .single();

    if (fetchError) {
      console.error('Error fetching quote:', fetchError);
      return createTrackingPixel();
    }

    // Update the quote with email open tracking
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        email_opened: true,
        email_opened_at: new Date().toISOString(),
        email_open_count: (quote?.email_open_count || 0) + 1
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating email open tracking:', updateError);
    } else {
      console.log(`Updated email open tracking for quote ${quoteId}. Open count: ${(quote?.email_open_count || 0) + 1}`);
    }

    // Return a 1x1 transparent pixel
    return createTrackingPixel();

  } catch (error) {
    console.error("Error in track-email-open function:", error);
    return createTrackingPixel();
  }
};

function createTrackingPixel(): Response {
  // 1x1 transparent PNG pixel
  const pixel = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  return new Response(pixel, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      ...corsHeaders,
    },
  });
}

serve(handler);
