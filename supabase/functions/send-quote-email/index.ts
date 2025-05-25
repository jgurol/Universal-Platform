
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, cc, subject, message, pdfBase64, fileName }: SendQuoteEmailRequest = await req.json();

    console.log('Sending email to:', to);
    console.log('CC recipients:', cc);
    console.log('Subject:', subject);

    // Prepare email recipients
    const recipients = [to];
    if (cc && cc.length > 0) {
      recipients.push(...cc);
    }

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Quotes <onboarding@resend.dev>", // You can customize this
      to: recipients,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
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
    console.error("Error sending quote email:", error);
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
