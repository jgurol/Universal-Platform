
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendQuoteEmailRequest {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
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
    console.log('Starting email send process...');
    
    const { to, cc, bcc, subject, message, pdfBase64, fileName, quoteId }: SendQuoteEmailRequest = await req.json();

    console.log('Sending email to:', to);
    console.log('CC recipients:', cc);
    console.log('BCC recipients:', bcc);
    console.log('Subject:', subject);
    console.log('Quote ID for tracking:', quoteId);

    // Validate required fields
    if (!to || !subject || !message || !pdfBase64 || !fileName) {
      console.error('Missing required fields');
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required fields: to, subject, message, pdfBase64, fileName" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Validate Resend API key
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Email service not configured properly" 
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Create tracking pixel URL
    const trackingPixelUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/track-email-open?quote=${quoteId}`;
    
    // Create acceptance URL - use the current origin (deployed app URL)
    const baseUrl = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || Deno.env.get("SUPABASE_URL")?.replace('supabase.co', 'lovable.app');
    const acceptanceUrl = `${baseUrl}/accept-quote/${quoteId}`;

    console.log('Acceptance URL generated:', acceptanceUrl);

    // Prepare email data with verified domain
    const emailData: any = {
      from: "California Telecom Sales <sales@californiatelecom.com>",
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          ${message.split('\n').map(line => `<p style="margin: 10px 0;">${line}</p>`).join('')}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptanceUrl}" 
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; border: none;">
              🖊️ ACCEPT AGREEMENT
            </a>
          </div>
          
          <p style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #4CAF50; border-radius: 4px;">
            <strong>📎 Quote Details:</strong> Please find the complete quote attached as a PDF. To accept this agreement, click the green button above or open the PDF and click the "Accept Agreement" button.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666; text-align: center;">
            This quote was sent from our quoting system. If you have any questions, please reply to this email.
          </p>
          
          <!-- Tracking pixel -->
          <img src="${trackingPixelUrl}" width="1" height="1" style="display: block; width: 1px; height: 1px;" alt="" />
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ],
    };

    // Add CC recipients if provided
    if (cc && cc.length > 0) {
      emailData.cc = cc;
    }

    // Add BCC recipients if provided
    if (bcc && bcc.length > 0) {
      emailData.bcc = bcc;
    }

    // Send email with PDF attachment, tracking pixel, and acceptance button
    console.log('Calling Resend API...');
    const emailResponse = await resend.emails.send(emailData);

    console.log("Resend API response:", emailResponse);

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
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

    // Check if we got a successful response
    if (!emailResponse.data) {
      console.error("No data returned from Resend API");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No response data from email service"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    console.log("Email sent successfully, ID:", emailResponse.data.id);

    // Email sent successfully
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending quote email:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred"
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
