

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
  fullName: string;
  type: 'welcome' | 'reset';
  temporaryPassword?: string;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, type, temporaryPassword }: EmailRequest = await req.json();

    let subject: string;
    let htmlContent: string;

    if (type === 'welcome') {
      subject = 'Welcome to Universal Platform';
      htmlContent = `
        <h1>Welcome to Universal Platform, ${fullName}!</h1>
        <p>Your account has been created successfully.</p>
        ${temporaryPassword ? `
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          <p>Please log in and change your password as soon as possible.</p>
        ` : `
          <p>Please check your email for the password reset link to set up your account.</p>
        `}
        <p>You can access the platform at: <a href="${Deno.env.get('SITE_URL') || 'https://your-site.com'}">${Deno.env.get('SITE_URL') || 'https://your-site.com'}</a></p>
        <p>Best regards,<br>The Universal Platform Team</p>
      `;
    } else {
      subject = 'Password Reset - Universal Platform';
      htmlContent = `
        <h1>Password Reset Request</h1>
        <p>Hello ${fullName},</p>
        <p>A password reset has been requested for your Universal Platform account.</p>
        <p>Please check your email for the password reset link.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Universal Platform Team</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: 'Universal Platform <noreply@californiatelecom.com>',
      to: [email],
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);

