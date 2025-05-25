
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendQuoteEmailRequest {
  to: string;
  cc?: string[];
  subject: string;
  message: string;
  pdfBase64: string;
  fileName: string;
  quoteId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      cc, 
      subject, 
      message, 
      pdfBase64, 
      fileName, 
      quoteId 
    }: SendQuoteEmailRequest = await req.json();

    console.log('Sending email to:', to);
    console.log('CC recipients:', cc);
    console.log('Subject:', subject);
    console.log('Quote ID for tracking:', quoteId);

    // Create Supabase client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Quotes <onboarding@resend.dev>",
      to: [to],
      cc: cc,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #007bff; margin: 0 0 10px 0;">Quote Request</h1>
            <p style="margin: 0; font-size: 16px;">Please find your requested quote attached.</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
            <div style="white-space: pre-wrap; font-family: Arial, sans-serif;">${message}</div>
            
            <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                <strong>Quote PDF attached:</strong> ${fileName}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 10px; color: #6c757d; font-size: 12px;">
            <p>This email was sent from our quoting system. Please contact us if you have any questions.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ],
    });

    console.log("Resend API response:", emailResponse);

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      
      // Update quote with error status
      await supabase
        .from('quotes')
        .update({
          email_status: 'error',
          email_sent_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      return new Response(JSON.stringify({ 
        success: false, 
        error: emailResponse.error.message || "Failed to send email via Resend"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Email sent successfully - update quote status
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        email_status: 'success',
        email_sent_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating quote email status:', updateError);
      // Don't fail the email send if status update fails, just log it
    } else {
      console.log('Quote email status updated successfully');
    }

    // Email sent successfully
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
