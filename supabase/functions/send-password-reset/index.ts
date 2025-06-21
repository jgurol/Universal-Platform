
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from './constants.ts';
import { handlePasswordResetRequest } from './requestHandler.ts';

// Environment validation
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

if (!resendApiKey) {
  console.error('Missing RESEND_API_KEY environment variable');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return handlePasswordResetRequest(req);
};

serve(handler);
