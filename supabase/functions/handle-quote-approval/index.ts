
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase client with service role key - this bypasses RLS
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestBody = await req.json()
    console.log('Request body received:', requestBody)
    
    // Handle both possible parameter names for backwards compatibility
    const quoteId = requestBody.quoteId || requestBody.quote_id
    
    if (!quoteId) {
      console.error('No quote ID provided in request')
      throw new Error('Quote ID is required')
    }
    
    console.log('Processing quote approval for quote:', quoteId)

    // Get the quote data first to ensure it exists
    const { data: quote, error: quoteError } = await supabaseServiceRole
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (quoteError) {
      console.error('Error fetching quote:', quoteError)
      throw quoteError
    }

    if (!quote) {
      console.error('Quote not found:', quoteId)
      throw new Error('Quote not found')
    }

    console.log('Quote found, processing approval for user:', quote.user_id)

    // Check if order already exists for this quote FIRST
    console.log('Checking for existing orders...')
    const { data: existingOrders, error: orderCheckError } = await supabaseServiceRole
      .from('orders')
      .select('id, order_number')
      .eq('quote_id', quoteId)

    if (orderCheckError) {
      console.error('Error checking existing orders:', orderCheckError)
      throw orderCheckError
    }

    let orderId: string
    let orderNumber: string

    if (existingOrders && existingOrders.length > 0) {
      // Order already exists, use the existing one
      orderId = existingOrders[0].id
      orderNumber = existingOrders[0].order_number
      console.log('Using existing order:', orderNumber)
    } else {
      // No existing order, create one first BEFORE updating quote status
      console.log('No existing order found, creating new order...')
      
      // Generate truly unique order number using timestamp and random component
      const now = new Date()
      const year = now.getFullYear()
      const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24))
      const timeComponent = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0')
      const randomComponent = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      
      orderNumber = `ORD-${year}-${dayOfYear.toString().padStart(3, '0')}-${timeComponent}${randomComponent}`
      console.log('Generated unique order number:', orderNumber)

      // Create new order using service role client FIRST
      console.log('About to create order with data:', {
        quote_id: quoteId,
        order_number: orderNumber,
        user_id: quote.user_id,
        client_id: quote.client_id,
        client_info_id: quote.client_info_id,
        amount: quote.amount,
        status: 'pending'
      })

      const { data: newOrder, error: orderError } = await supabaseServiceRole
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
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        
        // If we get a duplicate key error, check if order was created by another process
        if (orderError.code === '23505' && orderError.message?.includes('orders_quote_id_key')) {
          console.log('Duplicate order detected, checking for existing order...')
          
          const { data: existingOrder, error: existingOrderError } = await supabaseServiceRole
            .from('orders')
            .select('id, order_number')
            .eq('quote_id', quoteId)
            .single()

          if (existingOrderError) {
            console.error('Error fetching existing order after duplicate:', existingOrderError)
            throw orderError // Throw original error
          }

          if (existingOrder) {
            console.log('Found existing order after duplicate error:', existingOrder.order_number)
            orderId = existingOrder.id
            orderNumber = existingOrder.order_number
          } else {
            throw orderError // Throw original error if no existing order found
          }
        } else {
          console.error('Order error details:', {
            code: orderError.code,
            message: orderError.message,
            details: orderError.details,
            hint: orderError.hint
          })
          throw orderError
        }
      } else {
        orderId = newOrder.id
        console.log('Created new order with ID:', orderId)
      }
    }

    // NOW update quote status to approved AFTER order creation
    console.log('Updating quote status to approved...')
    const { error: quoteUpdateError } = await supabaseServiceRole
      .from('quotes')
      .update({
        status: 'approved',
        acceptance_status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', quoteId)

    if (quoteUpdateError) {
      console.error('Error updating quote status:', quoteUpdateError)
      throw quoteUpdateError
    }

    console.log('Quote status updated to approved successfully')

    // Get quote items with circuit-related categories
    const circuitCategories = ['broadband', 'dedicated fiber', 'fixed wireless', '4G/5G']
    
    const { data: circuitItems, error: itemsError } = await supabaseServiceRole
      .from('quote_items')
      .select(`
        *,
        item:items(
          *,
          category:categories(name)
        )
      `)
      .eq('quote_id', quoteId)

    if (itemsError) {
      console.error('Error fetching quote items:', itemsError)
      throw itemsError
    }

    // Filter items that are circuit-related
    const circuitRelatedItems = circuitItems?.filter(item => 
      item.item?.category?.name && 
      circuitCategories.some(cat => 
        item.item.category.name.toLowerCase().includes(cat.toLowerCase())
      )
    ) || []

    console.log('Found circuit-related items:', circuitRelatedItems.length)

    // Check for existing circuit tracking record for this order (should be only one per order)
    const { data: existingTracking, error: trackingCheckError } = await supabaseServiceRole
      .from('circuit_tracking')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle()

    if (trackingCheckError) {
      console.error('Error checking existing circuit tracking:', trackingCheckError)
      throw trackingCheckError
    }

    // Only create circuit tracking if we have circuit items and no existing tracking
    if (circuitRelatedItems.length > 0 && !existingTracking) {
      // Get the primary circuit type (use the first one found)
      const primaryCircuitItem = circuitRelatedItems[0]
      const circuitType = circuitCategories.find(cat => 
        primaryCircuitItem.item.category.name.toLowerCase().includes(cat.toLowerCase())
      ) || 'broadband'

      console.log('Creating single circuit tracking record for order:', orderId)
      
      const { error: trackingError } = await supabaseServiceRole
        .from('circuit_tracking')
        .insert({
          order_id: orderId,
          quote_item_id: primaryCircuitItem.id,
          circuit_type: circuitType.toLowerCase(),
          status: 'ordered',
          progress_percentage: 0,
          item_name: primaryCircuitItem.item.name,
          item_description: primaryCircuitItem.item.description
        })

      if (trackingError) {
        console.error('Error creating circuit tracking record:', trackingError)
        console.error('Circuit tracking error details:', {
          code: trackingError.code,
          message: trackingError.message,
          details: trackingError.details,
          hint: trackingError.hint
        })
        throw trackingError
      }

      console.log('Created circuit tracking record successfully')
    } else if (existingTracking) {
      console.log('Circuit tracking already exists for this order')
    } else {
      console.log('No circuit items found, skipping circuit tracking creation')
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderIds: [orderId],
        orderNumbers: [orderNumber],
        message: existingOrders && existingOrders.length > 0 ? 'Order already exists for this quote' : 'Order created successfully',
        ordersCount: 1,
        circuitTrackingCreated: circuitRelatedItems.length > 0 && !existingTracking ? 1 : 0,
        quoteUpdated: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in handle-quote-approval:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
