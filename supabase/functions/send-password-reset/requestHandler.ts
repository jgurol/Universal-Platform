
import { corsHeaders, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS, MAX_PAYLOAD_SIZE } from './constants.ts';
import { checkRateLimit } from './rateLimiting.ts';
import { validateEmail, validatePayloadSize } from './validation.ts';
import { generateSecureToken, hashToken } from './crypto.ts';
import { findUserByEmail, storeResetToken } from './database.ts';
import { sendResetEmail } from './email.ts';
import type { PasswordResetRequest } from './types.ts';

export const handlePasswordResetRequest = async (req: Request): Promise<Response> => {
  try {
    // Rate limiting by IP
    const clientIP = req.headers.get('CF-Connecting-IP') || 
                    req.headers.get('X-Forwarded-For') || 
                    'unknown';
    
    if (!checkRateLimit(clientIP, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
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
    if (!validatePayloadSize(body, MAX_PAYLOAD_SIZE)) {
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

    // Find user by email
    const user = await findUserByEmail(email);
    
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

    console.log('Generated reset token for user:', user.id);

    // Store hashed token in database
    await storeResetToken(user.id, hashedToken);

    // Send password reset email
    await sendResetEmail(email, resetToken);

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
