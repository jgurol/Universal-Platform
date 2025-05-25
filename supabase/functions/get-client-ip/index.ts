
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the real IP address from various headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    // Priority order: CF-Connecting-IP (Cloudflare), X-Forwarded-For, X-Real-IP
    let clientIp = cfConnectingIp || 
                   (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
                   realIp || 
                   'unknown';

    console.log('Client IP detection:', {
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIp,
      'cf-connecting-ip': cfConnectingIp,
      'determined-ip': clientIp
    });

    return new Response(
      JSON.stringify({ ip: clientIp }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error getting client IP:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get IP address', ip: 'unknown' }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});
