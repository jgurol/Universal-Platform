
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

const generateOrderNumber = async (): Promise<string> => {
  // Get the highest existing order number
  const { data: lastOrder, error } = await supabase
    .from('orders')
    .select('order_number')
    .order('order_number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching last order number:', error);
    // If we can't get the last order, start from 15000
    return '15000';
  }

  if (!lastOrder || lastOrder.length === 0) {
    // No orders exist yet, start from 15000
    return '15000';
  }

  const lastOrderNumber = lastOrder[0].order_number;
  
  // Extract the numeric part and increment
  const numericPart = parseInt(lastOrderNumber);
  if (isNaN(numericPart)) {
    // If the last order number isn't numeric, start from 15000
    return '15000';
  }

  const nextNumber = numericPart + 1;
  return nextNumber.toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId } = await req.json();

    console.log('Processing quote approval for:', quoteId);

    // First, check if orders already exist for this quote
    const { data: existingOrders, error: existingOrdersError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('quote_id', quoteId);

    if (existingOrdersError) {
      console.error('Error checking existing orders:', existingOrdersError);
      throw new Error(`Failed to check existing orders: ${existingOrdersError.message}`);
    }

    if (existingOrders && existingOrders.length > 0) {
      console.log('Orders already exist for quote:', quoteId, 'Count:', existingOrders.length);
      return new Response(JSON.stringify({ 
        success: true, 
        orderIds: existingOrders.map(o => o.id),
        orderNumbers: existingOrders.map(o => o.order_number),
        message: 'Orders already exist for this quote',
        ordersCount: existingOrders.length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get quote details 
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      throw new Error(`Failed to fetch quote: ${quoteError?.message}`);
    }

    console.log(`Creating single order for quote ${quoteId}`);

    // Generate sequential order number
    const orderNumber = await generateOrderNumber();

    // Ensure user_id is properly set
    if (!quote.user_id) {
      throw new Error('Quote user_id is missing - cannot create order');
    }

    console.log(`Creating order for quote ${quoteId} with user_id: ${quote.user_id} and order number: ${orderNumber}`);

    // Create single order for the entire quote
    const orderData = {
      quote_id: quoteId,
      order_number: orderNumber,
      user_id: quote.user_id,
      client_id: quote.client_id,
      client_info_id: quote.client_info_id,
      amount: quote.amount,
      status: 'pending',
      billing_address: quote.billing_address,
      service_address: quote.service_address,
      notes: quote.notes || `Order for quote ${quote.quote_number || quoteId}`,
      commission: quote.commission || 0,
      commission_override: quote.commission_override
    };

    console.log('Order data to insert:', orderData);

    // Insert the order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error(`Failed to create order:`, orderError);
      
      // If it's a duplicate key error, try to fetch the existing order
      if (orderError.code === '23505') {
        console.log('Duplicate order detected, fetching existing order');
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('quote_id', quoteId)
          .single();
        
        if (existingOrder) {
          console.log('Found existing order:', existingOrder.id);
          return new Response(JSON.stringify({ 
            success: true, 
            orderIds: [existingOrder.id],
            orderNumbers: [existingOrder.order_number],
            ordersCount: 1,
            message: 'Order already exists for this quote'
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log(`Created order ${newOrder.id} with number ${orderNumber}`);

    return new Response(JSON.stringify({ 
      success: true, 
      orderIds: [newOrder.id],
      orderNumbers: [newOrder.order_number],
      ordersCount: 1
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
