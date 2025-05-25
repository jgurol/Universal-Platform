
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendApprovalEmailRequest {
  to: string;
  clientName: string;
  quoteNumber: string;
  companyName?: string;
  pdfBase64: string;
  signatureData: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      clientName, 
      quoteNumber, 
      companyName, 
      pdfBase64, 
      signatureData 
    }: SendApprovalEmailRequest = await req.json();

    console.log('Sending approval email to:', to);
    console.log('Quote number:', quoteNumber);

    // Create HTML email content
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #28a745; margin: 0 0 10px 0;">Agreement Approved!</h1>
          <p style="margin: 0; font-size: 16px;">Your service agreement has been successfully processed.</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Dear ${clientName},</h2>
          
          <p>Thank you for digitally signing and accepting our service agreement. We're pleased to confirm that your agreement has been approved and is now active.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #495057;">Agreement Details:</h3>
            <p style="margin: 5px 0;"><strong>Agreement Number:</strong> ${quoteNumber}</p>
            ${companyName ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Approved</span></p>
            <p style="margin: 5px 0;"><strong>Date Approved:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>Please find attached:</p>
          <ul>
            <li>Your signed service agreement (PDF)</li>
            <li>Digital signature proof</li>
          </ul>
          
          <p>We will begin processing your service setup and will contact you with the next steps shortly.</p>
          
          <p>If you have any questions about your agreement or our services, please don't hesitate to contact us.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>California Telecom, Inc.</strong><br>
            <span style="color: #6c757d;">Customer Success Team</span>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 10px; color: #6c757d; font-size: 12px;">
          <p>This is an automated confirmation email. Please keep this for your records.</p>
        </div>
      </div>
    `;

    // Send email with PDF attachment and signature proof
    const emailResponse = await resend.emails.send({
      from: "Service Agreements <onboarding@resend.dev>",
      to: [to],
      subject: `Agreement Approved - ${quoteNumber}${companyName ? ` (${companyName})` : ''}`,
      html: emailHTML,
      attachments: [
        {
          filename: `Agreement_${quoteNumber}_Signed.pdf`,
          content: pdfBase64,
        },
        {
          filename: `Signature_Proof_${quoteNumber}.png`,
          content: signatureData.split(',')[1], // Remove data:image/png;base64, prefix
        },
      ],
    });

    console.log("Resend API response:", emailResponse);

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: emailResponse.error.message || "Failed to send approval email via Resend"
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
    console.error("Error sending approval email:", error);
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
