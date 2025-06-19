import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

interface EmailRequest {
  email: string;
  fullName: string;
  type: 'welcome' | 'reset';
  temporaryPassword?: string;
}

// Email validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const dangerousChars = /[\r\n\0%]/;
  return emailRegex.test(email) && !dangerousChars.test(email) && email.length <= 254;
};

// Name validation
const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 1 && name.length <= 100;
};

// HTML escape function
const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const body = await req.text();
    if (body.length > 5000) { // Prevent DoS via large payloads
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Request payload too large" 
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { email, fullName, type, temporaryPassword }: EmailRequest = JSON.parse(body);

    // Input validation
    if (!validateEmail(email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid email format" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!validateName(fullName)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid name format" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!['welcome', 'reset'].includes(type)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid email type" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Sanitize inputs for safe HTML inclusion
    const sanitizedEmail = escapeHtml(email.toLowerCase().trim());
    const sanitizedName = escapeHtml(fullName.trim());
    const sanitizedPassword = temporaryPassword ? escapeHtml(temporaryPassword) : '';

    let subject: string;
    let htmlContent: string;

    if (type === 'welcome') {
      subject = 'Welcome to Universal Platform';
      htmlContent = `
        <h1>Welcome to Universal Platform, ${sanitizedName}!</h1>
        <p>Your account has been created successfully.</p>
        ${temporaryPassword ?  `
          <p><strong>Temporary Password:</strong> ${sanitizedPassword}</p>
          <p>Please log in and change your password as soon as possible.</p>
        ` : `
          <p>Please check your email for the password reset link to set up your account.</p>
        `}
        <p>You can access the platform at: <a href="https://universal.californiatelecom.com">https://universal.californiatelecom.com</a></p>
        <p>Best regards,<br>The Universal Platform Team</p>
      `;
    } else {
      subject = 'Password Reset - Universal Platform';
      htmlContent = `
        <h1>Password Reset Request</h1>
        <p>Hello ${sanitizedName},</p>
        <p>A password reset has been requested for your Universal Platform account.</p>
        <p>Please check your email for the password reset link.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Universal Platform Team</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: 'Universal Platform <noreply@californiatelecom.com>',
      to: [sanitizedEmail],
      subject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in send-user-email function:', error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
