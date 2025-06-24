
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
    const { quoteId, action } = await req.json();

    console.log('Processing request for quote:', quoteId, 'action:', action);

    // Handle status-only update
    if (action === 'update_status_only') {
      console.log('Updating quote status only for:', quoteId);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('quotes')
        .update({ 
          status: 'approved',
          accepted_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating quote status:', updateError);
        throw new Error(`Failed to update quote status: ${updateError.message}`);
      }

      console.log('Quote status updated successfully:', updateResult);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Quote status updated successfully',
        quote: updateResult
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Original order creation logic
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
      
      // Since orders exist, let's just try to update the quote status directly
      console.log('Attempting to update quote status for existing orders...');
      
      const { data: statusUpdate, error: statusUpdateError } = await supabase
        .from('quotes')
        .update({ 
          status: 'approved',
          accepted_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .select('*')
        .single();

      if (statusUpdateError) {
        console.error('Error updating quote status for existing orders:', statusUpdateError);
        
        // Even if status update fails, the orders exist, so return success but note the issue
        return new Response(JSON.stringify({ 
          success: true, 
          orderIds: existingOrders.map(o => o.id),
          orderNumbers: existingOrders.map(o => o.order_number),
          message: 'Orders already exist, but status update failed. Orders are valid.',
          ordersCount: existingOrders.length,
          statusUpdateSuccess: false,
          requiresRefresh: true
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log('Successfully updated quote status for existing orders');
      
      return new Response(JSON.stringify({ 
        success: true, 
        orderIds: existingOrders.map(o => o.id),
        orderNumbers: existingOrders.map(o => o.order_number),
        message: 'Orders already exist and quote status updated successfully',
        ordersCount: existingOrders.length,
        statusUpdateSuccess: true,
        requiresRefresh: false
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get quote details using service role client to bypass RLS
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      throw new Error(`Failed to fetch quote: ${quoteError?.message}`);
    }

    // Generate sequential order number
    const orderNumber = await generateOrderNumber();

    // Ensure user_id is properly set
    if (!quote.user_id) {
      throw new Error('Quote user_id is missing - cannot create order');
    }

    console.log(`Creating order for quote ${quoteId} with user_id: ${quote.user_id} and order number: ${orderNumber}`);

    let newOrderId: string | null = null;
    let orderCreationSuccess = false;

    // Try to create the order
    try {
      const { data: createdOrderId, error: orderError } = await supabase
        .rpc('create_order_bypass_rls', {
          p_quote_id: quoteId,
          p_order_number: orderNumber,
          p_user_id: quote.user_id,
          p_amount: quote.amount,
          p_status: 'pending',
          p_commission: quote.commission || 0,
          p_client_id: quote.client_id,
          p_client_info_id: quote.client_info_id,
          p_billing_address: quote.billing_address,
          p_service_address: quote.service_address,
          p_notes: quote.notes || `Order for quote ${quote.quote_number || quoteId}`,
          p_commission_override: quote.commission_override
        });

      if (orderError) {
        console.error(`Failed to create order via RPC:`, orderError);
        
        // Check if this is a duplicate key error
        if (orderError.message?.includes('duplicate key value violates unique constraint "orders_quote_id_key"')) {
          console.log('Duplicate order detected during creation, checking if order now exists...');
          
          // Re-check for existing orders
          const { data: reCheckOrders, error: reCheckError } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('quote_id', quoteId);

          if (!reCheckError && reCheckOrders && reCheckOrders.length > 0) {
            console.log('Found existing orders after duplicate creation error:', reCheckOrders);
            newOrderId = reCheckOrders[0].id;
            orderCreationSuccess = true;
          }
        }
        
        if (!orderCreationSuccess) {
          throw new Error(`Failed to create order: ${orderError.message}`);
        }
      } else {
        newOrderId = createdOrderId;
        orderCreationSuccess = true;
        console.log(`Created order ${newOrderId} with number ${orderNumber}`);
      }
    } catch (err) {
      console.error('Exception during order creation:', err);
      throw err;
    }

    if (!newOrderId || !orderCreationSuccess) {
      throw new Error('Order creation failed or returned no ID');
    }

    // Now try to update quote status - but make this a separate operation
    console.log('Order created successfully, now updating quote status...');
    
    let statusUpdateSuccess = false;
    try {
      const { data: statusUpdate, error: quoteUpdateError } = await supabase
        .from('quotes')
        .update({ 
          status: 'approved',
          accepted_at: new Date().toISOString()
        })
        .eq('id', quoteId)
        .select('*')
        .single();

      if (quoteUpdateError) {
        console.error('Error updating quote status after order creation:', quoteUpdateError);
        console.log('Will attempt alternative status update approach...');
        
        // Try a more direct approach
        const { error: directUpdateError } = await supabase
          .from('quotes')
          .update({ status: 'approved' })
          .eq('id', quoteId);
          
        if (directUpdateError) {
          console.error('Direct status update also failed:', directUpdateError);
        } else {
          console.log('Direct status update succeeded');
          statusUpdateSuccess = true;
        }
      } else {
        console.log('Successfully updated quote status to approved');
        statusUpdateSuccess = true;
      }
    } catch (err) {
      console.error('Exception updating quote status:', err);
    }

    // Handle circuit tracking creation
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
    } else if (quoteItems) {
      console.log(`Total quote items fetched: ${quoteItems.length}`);
      
      // Log all items and their categories for debugging
      quoteItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          id: item.id,
          item_name: item.item?.name,
          category_name: item.item?.category?.name,
          category_type: item.item?.category?.type
        });
      });

      // Filter items that have Circuit category type
      const circuitItems = quoteItems.filter(item => {
        const isCircuit = item.item?.category?.type === 'Circuit';
        console.log(`Item ${item.item?.name} - Category type: ${item.item?.category?.type}, Is Circuit: ${isCircuit}`);
        return isCircuit;
      });

      console.log(`Found ${circuitItems.length} circuit items to track out of ${quoteItems.length} total items`);

      if (circuitItems.length === 0) {
        console.log('No circuit items found - checking for legacy circuit categories');
        // Also check for legacy circuit categories by name
        const legacyCircuitItems = quoteItems.filter(item => {
          const categoryName = item.item?.category?.name?.toLowerCase();
          const isLegacyCircuit = categoryName && ['broadband', 'dedicated fiber', 'fixed wireless', '4g/5g', 'circuit'].includes(categoryName);
          if (isLegacyCircuit) {
            console.log(`Found legacy circuit item: ${item.item?.name} with category: ${categoryName}`);
          }
          return isLegacyCircuit;
        });
        
        console.log(`Found ${legacyCircuitItems.length} legacy circuit items`);
        
        // Use legacy circuit items if no Circuit type items found
        if (legacyCircuitItems.length > 0) {
          circuitItems.push(...legacyCircuitItems);
        }
      }

      // Create circuit tracking records for each circuit item using service role client
      for (let i = 0; i < circuitItems.length; i++) {
        const circuitItem = circuitItems[i];
        const circuitTrackingData = {
          order_id: newOrderId,
          quote_item_id: circuitItem.id,
          circuit_type: circuitItem.item?.category?.name || 'Circuit',
          status: 'ordered',
          progress_percentage: 0,
          item_name: circuitItem.item?.name,
          item_description: circuitItem.item?.description
        };

        console.log(`Creating circuit tracking ${i + 1}/${circuitItems.length} for item:`, {
          quote_item_id: circuitItem.id,
          item_name: circuitItem.item?.name,
          circuit_type: circuitItem.item?.category?.name
        });

        const { data: newCircuitTracking, error: circuitTrackingError } = await supabase
          .from('circuit_tracking')
          .insert(circuitTrackingData)
          .select()
          .single();

        if (circuitTrackingError) {
          console.error(`Error creating circuit tracking for item ${circuitItem.id}:`, circuitTrackingError);
          // Don't throw here - continue with other items
        } else {
          console.log(`Successfully created circuit tracking ${newCircuitTracking.id} for quote item ${circuitItem.id}`);
        }
      }

      console.log(`Circuit tracking creation completed. Created ${circuitItems.length} tracking records.`);
    }

    // Return success with detailed information about what happened
    const responseMessage = statusUpdateSuccess 
      ? 'Order created successfully and quote status updated to approved'
      : 'Order created successfully but quote status update needs manual refresh';

    return new Response(JSON.stringify({ 
      success: true, 
      orderIds: [newOrderId],
      orderNumbers: [orderNumber],
      ordersCount: 1,
      message: responseMessage,
      statusUpdateSuccess: statusUpdateSuccess,
      requiresRefresh: !statusUpdateSuccess,
      orderCreationSuccess: true
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in fix-quote-approval function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        orderCreationSuccess: false,
        statusUpdateSuccess: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
