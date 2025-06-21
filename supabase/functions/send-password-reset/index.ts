
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

interface PasswordResetRequest {
  email: string;
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string, maxAttempts: number = 3, windowMs: number = 300000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
};

// Enhanced email validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dangerousChars = /[\r\n\0%<>]/;
  return emailRegex.test(email) && !dangerousChars.test(email) && email.length <= 254;
};

// Secure token generation
const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Hash token for storage
const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, b => b.toString(16).padStart(2, '0')).join('');
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
    // Rate limiting by IP
    const clientIP = req.headers.get('CF-Connecting-IP') || 
                    req.headers.get('X-Forwarded-For') || 
                    'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Too many requests. Please try again later." 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Parse and validate request body
    const body = await req.text();
    if (body.length > 1000) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Request payload too large" 
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { email }: PasswordResetRequest = JSON.parse(body);

    // Validate email
    if (!validateEmail(email)) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Processing password reset request for:', email.toLowerCase());

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

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
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
    const resetToken = generateSecureToken();
    const hashedToken = await hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    console.log('Generated reset token for user:', user.id);
    console.log('Token expires at:', expiresAt.toISOString());

    // Store hashed token in database
    console.log('Attempting to store reset token...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: hashedToken, // Store hashed token
        expires_at: expiresAt.toISOString(),
        used: false
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Error storing reset token:", tokenError);
      console.error("Token error details:", JSON.stringify(tokenError, null, 2));
      
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

    // Get the site URL for the reset link (use plain token in URL, hashed version is stored)
    const siteUrl = 'https://34d679df-b261-47ea-b136-e7aae591255b.lovableproject.com';
    const resetUrl = `${siteUrl}/auth?reset_token=${resetToken}`;

    // Sanitize email for safe inclusion in email content
    const sanitizedEmail = email.replace(/[<>"'&]/g, '');

    // Send password reset email via Resend
    console.log('Sending email to:', sanitizedEmail);
    const emailResponse = await resend.emails.send({
      from: 'Universal Platform <noreply@californiatelecom.com>',
      to: [sanitizedEmail],
      subject: 'Password Reset - Universal Platform',
      html: `
        <h1>Password Reset Request</h1>
        <p>You have requested to reset your password for your Universal Platform account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
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
