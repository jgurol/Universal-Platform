
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
    const { email }: PasswordResetRequest = await req.json();

    console.log('Processing password reset request for:', email);

    // Find user by email using admin API
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to process request" 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return new Response(JSON.stringify({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomUUID() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    console.log('Generated reset token for user:', user.id);
    console.log('Token expires at:', expiresAt.toISOString());

    // Store reset token in database - check if table exists first
    console.log('Attempting to store reset token...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Error storing reset token:", tokenError);
      console.error("Token error details:", JSON.stringify(tokenError, null, 2));
      
      // Try to get more info about the table
      const { data: tableInfo, error: tableError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .limit(1);
      
      console.log('Table check result:', { tableInfo, tableError });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to generate reset token",
        details: tokenError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Reset token stored successfully:', tokenData);

    // Get the site URL for the reset link
    const siteUrl = 'https://34d679df-b261-47ea-b136-e7aae591255b.lovableproject.com';
    const resetUrl = `${siteUrl}/auth?reset_token=${resetToken}`;

    // Send password reset email via Resend
    console.log('Sending email to:', email);
    const emailResponse = await resend.emails.send({
      from: 'California Telecom <onboarding@resend.dev>',
      to: [email],
      subject: 'Password Reset - Universal Platform',
      html: `
        <h1>Password Reset Request</h1>
        <p>You have requested to reset your password for your Universal Platform account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The Universal Platform Team</p>
      `,
    });

    console.log('Password reset email sent via Resend:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "If an account with that email exists, a password reset link has been sent." 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Exception in send-password-reset:", error);
    console.error("Error stack:", error.stack);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "An unexpected error occurred",
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
