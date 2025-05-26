
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
    console.log('Using service role client for database operations')

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
      
      // Update the quote status to approved (safe to do multiple times)
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
    } else {
      // No existing order, need to create one
      console.log('No existing order found, creating new order...')
      
      // Get the quote data first
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

      console.log('Quote found, creating order for user:', quote.user_id)

      // Generate sequential order number starting from 15000
      const { data: lastOrder, error: lastOrderError } = await supabaseServiceRole
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)

      if (lastOrderError && lastOrderError.code !== 'PGRST116') {
        console.error('Error fetching last order:', lastOrderError)
        throw lastOrderError
      }

      let nextOrderNumber = 15000
      if (lastOrder && lastOrder.length > 0 && lastOrder[0].order_number) {
        const lastNumber = parseInt(lastOrder[0].order_number)
        if (!isNaN(lastNumber)) {
          nextOrderNumber = Math.max(lastNumber + 1, 15000)
        }
      }

      orderNumber = nextOrderNumber.toString()
      console.log('Generated order number:', orderNumber)

      // Update quote status first, then create order
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

      // Create new order using service role client
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

    // Check for existing circuit tracking records for this order
    const { data: existingTracking, error: trackingCheckError } = await supabaseServiceRole
      .from('circuit_tracking')
      .select('id, quote_item_id')
      .eq('order_id', orderId)

    if (trackingCheckError) {
      console.error('Error checking existing circuit tracking:', trackingCheckError)
      throw trackingCheckError
    }

    const existingItemIds = new Set(existingTracking?.map(t => t.quote_item_id) || [])

    // Create circuit tracking records for each circuit item that doesn't already have tracking
    const trackingRecords = []
    for (const item of circuitRelatedItems) {
      if (!existingItemIds.has(item.id)) {
        const circuitType = circuitCategories.find(cat => 
          item.item.category.name.toLowerCase().includes(cat.toLowerCase())
        ) || 'broadband'

        trackingRecords.push({
          order_id: orderId,
          quote_item_id: item.id,
          circuit_type: circuitType.toLowerCase(),
          status: 'ordered',
          progress_percentage: 0,
          item_name: item.item.name,
          item_description: item.item.description
        })
      }
    }

    if (trackingRecords.length > 0) {
      console.log('About to create circuit tracking records:', trackingRecords.length)
      
      const { error: trackingError } = await supabaseServiceRole
        .from('circuit_tracking')
        .insert(trackingRecords)

      if (trackingError) {
        console.error('Error creating circuit tracking records:', trackingError)
        console.error('Circuit tracking error details:', {
          code: trackingError.code,
          message: trackingError.message,
          details: trackingError.details,
          hint: trackingError.hint
        })
        throw trackingError
      }

      console.log('Created circuit tracking records:', trackingRecords.length)
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderIds: [orderId],
        orderNumbers: [orderNumber],
        message: existingOrders && existingOrders.length > 0 ? 'Order already exists for this quote' : 'Order created successfully',
        ordersCount: 1,
        circuitTrackingCreated: trackingRecords.length
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
