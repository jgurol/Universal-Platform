
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

const generateUniqueOrderNumber = async (attempts = 0): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  const millisecond = now.getMilliseconds();
  
  // Add attempt number and milliseconds to ensure uniqueness
  const suffix = attempts > 0 ? `-${attempts}` : '';
  const orderNumber = `ORD-${year}-${dayOfYear.toString().padStart(3, '0')}-${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}${second.toString().padStart(2, '0')}${millisecond.toString().padStart(3, '0')}${suffix}`;

  // Check if this order number already exists
  const { data: existingOrderNumber } = await supabase
    .from('orders')
    .select('id')
    .eq('order_number', orderNumber)
    .single();

  if (!existingOrderNumber) {
    return orderNumber;
  } else if (attempts < 10) {
    // Wait a bit and try again with incremented attempt
    await new Promise(resolve => setTimeout(resolve, 50));
    return generateUniqueOrderNumber(attempts + 1);
  } else {
    throw new Error('Failed to generate unique order number after multiple attempts');
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();

    console.log('Processing quote approval for:', quoteId);

    // First, check if orders already exist for this quote
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('quote_id', quoteId);

    if (existingOrders && existingOrders.length > 0) {
      console.log('Orders already exist for quote:', quoteId);
      return new Response(JSON.stringify({ 
        success: true, 
        orderIds: existingOrders.map(o => o.id),
        orderNumbers: existingOrders.map(o => o.order_number),
        message: 'Orders already exist for this quote'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get quote details with items
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

    if (!quote.quote_items || quote.quote_items.length === 0) {
      throw new Error('No quote items found for this quote');
    }

    console.log(`Creating ${quote.quote_items.length} orders for quote items`);

    const createdOrders = [];
    const circuitCategories = ['broadband', 'dedicated fiber', 'fixed wireless', '4g/5g'];

    // Create an order for each quote item
    for (const quoteItem of quote.quote_items) {
      const orderNumber = await generateUniqueOrderNumber();

      // Ensure user_id is properly set - this is crucial for RLS
      if (!quote.user_id) {
        throw new Error('Quote user_id is missing - cannot create order');
      }

      console.log(`Creating order for quote item ${quoteItem.id} with user_id: ${quote.user_id}`);

      // Create order for this item with explicit user_id
      const orderData = {
        quote_id: quoteId,
        order_number: orderNumber,
        user_id: quote.user_id, // Explicitly set the user_id
        client_id: quote.client_id,
        client_info_id: quote.client_info_id,
        amount: quoteItem.total_price, // Use the item's total price
        status: 'pending',
        billing_address: quote.billing_address,
        service_address: quote.service_address,
        notes: `Order for: ${quoteItem.item?.name || 'Unknown Item'} (Qty: ${quoteItem.quantity})`,
        commission: quote.commission ? (quote.commission * quoteItem.total_price / quote.amount) : 0,
        commission_override: quote.commission_override ? (quote.commission_override * quoteItem.total_price / quote.amount) : undefined
      };

      console.log('Order data to insert:', orderData);

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error(`Failed to create order for item ${quoteItem.id}:`, orderError);
        console.error('Order data that failed:', orderData);
        throw new Error(`Failed to create order for item: ${orderError.message}`);
      }

      console.log(`Created order ${newOrder.id} with number ${orderNumber} for item: ${quoteItem.item?.name}`);
      createdOrders.push(newOrder);

      // Check if this item is circuit-related
      if (quoteItem.item?.category && 
          circuitCategories.includes(quoteItem.item.category.name.toLowerCase())) {
        
        const circuitType = quoteItem.item.category.name.toLowerCase();
        
        // Create circuit tracking for this order
        const { error: trackingError } = await supabase
          .from('circuit_tracking')
          .insert({
            order_id: newOrder.id,
            circuit_type: circuitType,
            status: 'ordered',
            progress_percentage: 0
          });

        if (trackingError) {
          console.error(`Failed to create circuit tracking for order ${newOrder.id}:`, trackingError);
        } else {
          console.log(`Created circuit tracking for order ${newOrder.id}`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderIds: createdOrders.map(o => o.id),
      orderNumbers: createdOrders.map(o => o.order_number),
      ordersCount: createdOrders.length,
      hasCircuitTracking: createdOrders.some(order => 
        quote.quote_items.some(item => 
          item.item?.category && 
          circuitCategories.includes(item.item.category.name.toLowerCase())
        )
      )
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
