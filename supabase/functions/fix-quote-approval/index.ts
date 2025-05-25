
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log('Processing quote approval for:', quoteId);

    // First, check if an order already exists for this quote
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('quote_id', quoteId)
      .single();

    if (existingOrder) {
      console.log('Order already exists for quote:', quoteId);
      return new Response(JSON.stringify({ success: true, orderId: existingOrder.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_items (
          *,
          item:items(
            *,
            category:categories(*)
          )
        )
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      throw new Error(`Failed to fetch quote: ${quoteError?.message}`);
    }

    // Generate unique order number by checking existing orders
    let orderNumber: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const now = new Date();
      const year = now.getFullYear();
      const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();
      
      // Add attempt number to ensure uniqueness if there are conflicts
      const suffix = attempts > 0 ? `-${attempts}` : '';
      orderNumber = `ORD-${year}-${dayOfYear.toString().padStart(3, '0')}-${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}${second.toString().padStart(2, '0')}${suffix}`;

      // Check if this order number already exists
      const { data: existingOrderNumber } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', orderNumber)
        .single();

      if (!existingOrderNumber) {
        isUnique = true;
      } else {
        attempts++;
        // Wait a bit before retrying to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique order number after multiple attempts');
    }

    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        quote_id: quoteId,
        order_number: orderNumber,
        user_id: quote.user_id,
        client_id: quote.client_id,
        client_info_id: quote.client_info_id,
        amount: quote.amount,
        status: 'pending',
        billing_address: quote.billing_address,
        service_address: quote.service_address,
        notes: quote.notes,
        commission: quote.commission,
        commission_override: quote.commission_override
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log('Created order:', newOrder.id, 'with order number:', orderNumber);

    // Check for circuit-related items
    const circuitCategories = ['broadband', 'dedicated fiber', 'fixed wireless', '4g/5g'];
    const circuitItems = quote.quote_items?.filter(item => 
      item.item?.category && 
      circuitCategories.includes(item.item.category.name.toLowerCase())
    ) || [];

    if (circuitItems.length > 0) {
      const circuitType = circuitItems[0].item.category.name.toLowerCase();
      
      // Create circuit tracking
      const { error: trackingError } = await supabase
        .from('circuit_tracking')
        .insert({
          order_id: newOrder.id,
          circuit_type: circuitType,
          status: 'ordered',
          progress_percentage: 0
        });

      if (trackingError) {
        console.error('Failed to create circuit tracking:', trackingError);
        // Don't fail the entire process if circuit tracking fails
      } else {
        console.log('Created circuit tracking for order:', newOrder.id);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: newOrder.id,
      orderNumber: orderNumber,
      hasCircuitTracking: circuitItems.length > 0
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in fix-quote-approval function:", error);
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
