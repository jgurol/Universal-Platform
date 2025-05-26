
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();
    console.log('Debugging quote items for quote:', quoteId);

    // Fetch quote items with detailed category information
    const { data: quoteItems, error: quoteItemsError } = await supabase
      .from('quote_items')
      .select(`
        *,
        item:items(
          *,
          category:categories(*)
        )
      `)
      .eq('quote_id', quoteId);

    if (quoteItemsError) {
      console.error('Error fetching quote items:', quoteItemsError);
      throw quoteItemsError;
    }

    console.log(`Total quote items: ${quoteItems?.length || 0}`);
    
    quoteItems?.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item.id,
        item_name: item.item?.name,
        category_id: item.item?.category_id,
        category_name: item.item?.category?.name,
        category_type: item.item?.category?.type,
        raw_item: item.item,
        raw_category: item.item?.category
      });
    });

    // Check existing circuit tracking for this quote
    const { data: existingTracking, error: trackingError } = await supabase
      .from('circuit_tracking')
      .select(`
        *,
        order:orders(quote_id, order_number)
      `)
      .eq('order.quote_id', quoteId);

    if (trackingError) {
      console.error('Error fetching existing circuit tracking:', trackingError);
    } else {
      console.log(`Existing circuit tracking records: ${existingTracking?.length || 0}`);
      existingTracking?.forEach((tracking, index) => {
        console.log(`Tracking ${index + 1}:`, {
          id: tracking.id,
          circuit_type: tracking.circuit_type,
          quote_item_id: tracking.quote_item_id,
          order_number: tracking.order?.order_number
        });
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      quoteItems: quoteItems || [],
      existingTracking: existingTracking || []
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in debug-quote-items function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
