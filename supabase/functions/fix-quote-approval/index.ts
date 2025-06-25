
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
  try {
    // Get the highest existing order number
    const { data: lastOrder, error } = await supabase
      .from('orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching last order number:', error);
      throw new Error(`Failed to generate order number: Database query failed - ${error.message}`);
    }

    if (!lastOrder || lastOrder.length === 0) {
      return '15000';
    }

    const lastOrderNumber = lastOrder[0].order_number;
    const numericPart = parseInt(lastOrderNumber);
    if (isNaN(numericPart)) {
      console.warn(`Invalid order number format found: ${lastOrderNumber}, defaulting to 15000`);
      return '15000';
    }

    const nextNumber = numericPart + 1;
    return nextNumber.toString();
  } catch (error) {
    console.error('Exception in generateOrderNumber:', error);
    throw new Error(`Order number generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const createQuoteAcceptanceRecord = async (quoteId: string, quote: any) => {
  console.log('Creating quote acceptance record for manual approval:', quoteId);
  
  try {
    // Check if acceptance record already exists
    const { data: existingAcceptance, error: checkError } = await supabase
      .from('quote_acceptances')
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing acceptance:', checkError);
      throw new Error(`Failed to check existing quote acceptance: ${checkError.message} (Code: ${checkError.code})`);
    }

    if (existingAcceptance) {
      console.log('Acceptance record already exists for quote:', quoteId);
      return true;
    }

    // Create acceptance record for manual approval
    const acceptanceData = {
      quote_id: quoteId,
      client_name: 'Manual Approval',
      client_email: 'admin@system.com',
      signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent pixel
      ip_address: null,
      user_agent: 'Manual Admin Approval'
    };

    const { error: insertError } = await supabase
      .from('quote_acceptances')
      .insert(acceptanceData);

    if (insertError) {
      console.error('Error creating acceptance record:', insertError);
      throw new Error(`Failed to create quote acceptance record: ${insertError.message} (Code: ${insertError.code})`);
    }

    console.log('Successfully created acceptance record for manual approval');
    return true;
  } catch (error) {
    console.error('Exception in createQuoteAcceptanceRecord:', error);
    throw new Error(`Quote acceptance creation failed: ${error instanceof Error ? error.message : 'Unknown error in acceptance record creation'}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, action } = await req.json();

    if (!quoteId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required parameter: quoteId"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Processing request for quote:', quoteId, 'action:', action);

    // Handle status-only update - just update the quote status without creating orders
    if (action === 'update_status_only') {
      console.log('Updating quote status only for:', quoteId);
      
      try {
        // Get quote details first for acceptance record creation
        const { data: quote, error: quoteError } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', quoteId)
          .single();

        if (quoteError) {
          console.error('Failed to fetch quote for status update:', quoteError);
          throw new Error(`Quote lookup failed: ${quoteError.message} (Code: ${quoteError.code}) - Quote ID: ${quoteId}`);
        }

        if (!quote) {
          throw new Error(`Quote not found: No quote exists with ID ${quoteId}`);
        }

        // Create acceptance record if it doesn't exist
        const acceptanceCreated = await createQuoteAcceptanceRecord(quoteId, quote);
        
        // Update quote status directly without using RPC to avoid constraint issues
        const { error: updateError } = await supabase
          .from('quotes')
          .update({
            status: 'approved',
            accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', quoteId);

        if (updateError) {
          console.error('Direct quote update failed:', updateError);
          throw new Error(`Quote status update failed: ${updateError.message} (Code: ${updateError.code}) - Direct update method`);
        }

        console.log('Quote status updated successfully via direct update');
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Quote status updated successfully',
          acceptanceRecordCreated: acceptanceCreated
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error in status-only update';
        console.error('Error in status-only update:', errorMessage);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Status update failed: ${errorMessage}`
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Original order creation logic for new approvals
    console.log('Processing quote approval for:', quoteId);

    try {
      // First, check if orders already exist for this quote
      const { data: existingOrders, error: existingOrdersError } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('quote_id', quoteId);

      if (existingOrdersError) {
        console.error('Error checking existing orders:', existingOrdersError);
        throw new Error(`Order lookup failed: ${existingOrdersError.message} (Code: ${existingOrdersError.code}) - Quote ID: ${quoteId}`);
      }

      if (existingOrders && existingOrders.length > 0) {
        console.log('Orders already exist for quote:', quoteId, 'Count:', existingOrders.length);
        
        // Since orders exist, just update the quote status and create acceptance record
        console.log('Updating quote status for existing orders...');
        
        try {
          // Get quote details for acceptance record creation
          const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', quoteId)
            .single();

          if (quoteError) {
            console.warn('Could not fetch quote for acceptance record:', quoteError);
          } else if (quote) {
            // Create acceptance record if it doesn't exist
            await createQuoteAcceptanceRecord(quoteId, quote);
          }
        } catch (acceptanceError) {
          console.warn('Failed to create acceptance record for existing orders:', acceptanceError);
          // Don't fail the whole operation for this
        }
        
        // Update quote status using the secure function to avoid constraint issues
        const { error: statusUpdateError } = await supabase.rpc('update_quote_status', {
          quote_id: quoteId,
          new_status: 'approved'
        });

        if (statusUpdateError) {
          console.error('Status update via RPC failed:', statusUpdateError);
          throw new Error(`Quote status update failed for existing orders: ${statusUpdateError.message} (Code: ${statusUpdateError.code})`);
        }

        console.log('Quote status updated successfully for existing orders');

        return new Response(JSON.stringify({ 
          success: true, 
          orderIds: existingOrders.map(o => o.id),
          orderNumbers: existingOrders.map(o => o.order_number),
          message: 'Orders already exist and quote status updated',
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

      if (quoteError) {
        console.error('Failed to fetch quote:', quoteError);
        throw new Error(`Quote fetch failed: ${quoteError.message} (Code: ${quoteError.code}) - Quote ID: ${quoteId}`);
      }

      if (!quote) {
        throw new Error(`Quote not found: No quote exists with ID ${quoteId}`);
      }

      if (!quote.user_id) {
        throw new Error(`Invalid quote data: Quote ${quoteId} is missing user_id field - cannot create order without user assignment`);
      }

      // Create acceptance record for manual approval
      await createQuoteAcceptanceRecord(quoteId, quote);

      const orderNumber = await generateOrderNumber();

      console.log(`Creating order for quote ${quoteId} with user_id: ${quote.user_id} and order number: ${orderNumber}`);

      let newOrderId: string | null = null;
      let orderCreationSuccess = false;

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
          throw new Error(`Order creation failed: ${orderError.message} (Code: ${orderError.code}) - RPC: create_order_bypass_rls`);
        }

        if (!createdOrderId) {
          throw new Error('Order creation failed: RPC returned no order ID despite no error');
        }

        newOrderId = createdOrderId;
        orderCreationSuccess = true;
        console.log(`Created order ${newOrderId} with number ${orderNumber}`);
      } catch (err) {
        console.error('Exception during order creation:', err);
        throw new Error(`Order creation exception: ${err instanceof Error ? err.message : 'Unknown error during order creation'}`);
      }

      // Now update quote status using the secure function to avoid constraint issues
      console.log('Order created successfully, now updating quote status...');
      
      let statusUpdateSuccess = false;
      const { error: statusUpdateError } = await supabase.rpc('update_quote_status', {
        quote_id: quoteId,
        new_status: 'approved'
      });

      if (statusUpdateError) {
        console.error('Status update via RPC failed:', statusUpdateError);
        throw new Error(`Quote status update failed after order creation: ${statusUpdateError.message} (Code: ${statusUpdateError.code}) - Order ${newOrderId} was created successfully`);
      } else {
        statusUpdateSuccess = true;
        console.log('Successfully updated quote status via RPC');
      }

      // Handle circuit tracking creation
      try {
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
          console.warn('Circuit tracking creation will be skipped due to quote items fetch failure');
        } else if (quoteItems) {
          console.log(`Total quote items fetched: ${quoteItems.length}`);
          
          quoteItems.forEach((item, index) => {
            console.log(`Item ${index + 1}:`, {
              id: item.id,
              item_name: item.item?.name,
              category_name: item.item?.category?.name,
              category_type: item.item?.category?.type
            });
          });

          const circuitItems = quoteItems.filter(item => {
            const isCircuit = item.item?.category?.type === 'Circuit';
            console.log(`Item ${item.item?.name} - Category type: ${item.item?.category?.type}, Is Circuit: ${isCircuit}`);
            return isCircuit;
          });

          console.log(`Found ${circuitItems.length} circuit items to track out of ${quoteItems.length} total items`);

          if (circuitItems.length === 0) {
            console.log('No circuit items found - checking for legacy circuit categories');
            const legacyCircuitItems = quoteItems.filter(item => {
              const categoryName = item.item?.category?.name?.toLowerCase();
              const isLegacyCircuit = categoryName && ['broadband', 'dedicated fiber', 'fixed wireless', '4g/5g', 'circuit'].includes(categoryName);
              if (isLegacyCircuit) {
                console.log(`Found legacy circuit item: ${item.item?.name} with category: ${categoryName}`);
              }
              return isLegacyCircuit;
            });
            
            console.log(`Found ${legacyCircuitItems.length} legacy circuit items`);
            
            if (legacyCircuitItems.length > 0) {
              circuitItems.push(...legacyCircuitItems);
            }
          }

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
              console.warn(`Circuit tracking failed for item ${circuitItem.item?.name}: ${circuitTrackingError.message}`);
            } else {
              console.log(`Successfully created circuit tracking ${newCircuitTracking.id} for quote item ${circuitItem.id}`);
            }
          }

          console.log(`Circuit tracking creation completed. Created ${circuitItems.length} tracking records.`);
        }
      } catch (circuitError) {
        console.error('Exception during circuit tracking creation:', circuitError);
        console.warn('Circuit tracking creation failed but order and quote approval will continue');
      }

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

    } catch (error) {
      console.error("Error in quote approval processing:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in quote approval processing';
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Quote approval failed: ${errorMessage}`,
        orderCreationSuccess: false,
        statusUpdateSuccess: false
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Critical error in fix-quote-approval function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown critical error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Function execution failed: ${errorMessage}`,
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
