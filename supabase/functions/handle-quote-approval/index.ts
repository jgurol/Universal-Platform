
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

    // Update quote status to approved
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Quote approved successfully',
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
