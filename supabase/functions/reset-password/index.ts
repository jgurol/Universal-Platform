
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Hash token for comparison
const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, b => b.toString(16).padStart(2, '0')).join('');
};

// Password validation
const validatePassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 128 && !/[\0-\x1f\x7f]/.test(password);
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const body = await req.text();
    if (body.length > 1000) { // Prevent DoS via large payloads
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Request payload too large" 
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { token, newPassword }: ResetPasswordRequest = JSON.parse(body);

    // Validate inputs
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid reset token" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!validatePassword(newPassword)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid password format" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Processing password reset with token');

    // Hash the provided token to compare with stored hash
    const hashedToken = await hashToken(token);

    // Verify reset token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', hashedToken)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      console.error("Invalid or expired token:", tokenError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid or expired reset token" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now > expiresAt) {
      console.error("Token has expired");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Reset token has expired" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Token is valid, updating password for user:', tokenData.user_id);

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { 
        password: newPassword 
      }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to update password" 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    if (markUsedError) {
      console.error("Error marking token as used:", markUsedError);
    }

    console.log('Password reset successful for user:', tokenData.user_id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Password has been successfully reset" 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Exception in reset-password:", error);
    console.error("Error stack:", error.stack);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "An unexpected error occurred"
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
