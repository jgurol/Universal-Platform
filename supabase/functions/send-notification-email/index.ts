import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface NotificationRequest {
  type: 'carrier_quote_generated' | 'circuit_quote_researching' | 'circuit_quote_completed' | 
        'quote_sent_to_customer' | 'customer_opens_email' | 'customer_accepts_quote' | 'deal_created_admin';
  userId: string;
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Notification Email Function Start ===');
  
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200,
        headers: corsHeaders 
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    
    const { type, userId, data }: NotificationRequest = await req.json();
    
    console.log('Processing notification:', { type, userId, data });

    // Get user profile and notification preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('User profile not found:', profileError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', preferencesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch preferences' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if notification is enabled for this type
    const isEnabled = preferences ? preferences[type] : true; // Default to true if no preferences set
    
    if (!isEnabled) {
      console.log('Notification disabled for user:', type);
      return new Response(JSON.stringify({ message: 'Notification disabled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Admin-only check for deal creation
    if (type === 'deal_created_admin' && profile.role !== 'admin') {
      console.log('Deal creation notification skipped - user not admin');
      return new Response(JSON.stringify({ message: 'Not authorized for admin notifications' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate email content based on notification type
    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'carrier_quote_generated':
        subject = `New Carrier Quote Generated - ${data.clientName}`;
        htmlContent = generateCarrierQuoteEmail(data, profile.full_name);
        break;
      
      case 'circuit_quote_researching':
        subject = `Circuit Quote Status: Researching - ${data.clientName}`;
        htmlContent = generateCircuitQuoteStatusEmail(data, profile.full_name, 'researching');
        break;
      
      case 'circuit_quote_completed':
        subject = `Circuit Quote Completed - ${data.clientName}`;
        htmlContent = generateCircuitQuoteStatusEmail(data, profile.full_name, 'completed');
        break;
      
      case 'quote_sent_to_customer':
        subject = `Quote Sent to Customer - ${data.clientName}`;
        htmlContent = generateQuoteSentEmail(data, profile.full_name);
        break;
      
      case 'customer_opens_email':
        subject = `Customer Opened Quote Email - ${data.clientName}`;
        htmlContent = generateCustomerOpenedEmail(data, profile.full_name);
        break;
      
      case 'customer_accepts_quote':
        subject = `🎉 Quote Accepted! - ${data.clientName}`;
        htmlContent = generateQuoteAcceptedEmail(data, profile.full_name);
        break;
      
      case 'deal_created_admin':
        subject = `New Deal Created - ${data.dealName}`;
        htmlContent = generateDealCreatedEmail(data, profile.full_name);
        break;
      
      default:
        console.error('Unknown notification type:', type);
        return new Response(JSON.stringify({ error: 'Unknown notification type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // Send email
    console.log('Sending email to:', profile.email);
    const emailResponse = await resend.emails.send({
      from: 'Universal Platform <noreply@californiatelecom.com>',
      to: [profile.email],
      subject: subject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'Notification email sent successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in notification email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error?.message || "An unexpected error occurred"
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

// Email template functions
function generateCarrierQuoteEmail(data: any, userName: string): string {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(data.price || 0);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Carrier Quote Generated</h2>
      
      <p>Hello ${userName},</p>
      
      <p>A new carrier quote has been generated and is ready for your review:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #666;">Quote Details</h3>
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Location:</strong> ${data.location}</p>
        <p><strong>Carrier:</strong> ${data.carrier}</p>
        <p><strong>Type:</strong> ${data.type}</p>
        <p><strong>Speed:</strong> ${data.speed}</p>
        <p><strong>Monthly Price:</strong> ${formattedPrice}</p>
        ${data.term ? `<p><strong>Term:</strong> ${data.term}</p>` : ''}
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
      </div>
      
      <p>
        <a href="https://universal.californiatelecom.com/circuit-quotes" 
           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View on Platform
        </a>
      </p>
    </div>
  `;
}

function generateCircuitQuoteStatusEmail(data: any, userName: string, status: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Circuit Quote Status Update</h2>
      
      <p>Hello ${userName},</p>
      
      <p>A circuit quote status has been updated to <strong>${status}</strong>:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #666;">Circuit Quote Details</h3>
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Location:</strong> ${data.location}</p>
        <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
        ${data.suite ? `<p><strong>Suite:</strong> ${data.suite}</p>` : ''}
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
      </div>
      
      <p>
        <a href="https://universal.californiatelecom.com/circuit-quotes" 
           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Circuit Quote
        </a>
      </p>
    </div>
  `;
}

function generateQuoteSentEmail(data: any, userName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Quote Sent to Customer</h2>
      
      <p>Hello ${userName},</p>
      
      <p>A quote has been successfully sent to the customer:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #666;">Quote Details</h3>
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Quote Number:</strong> ${data.quoteNumber}</p>
        <p><strong>Amount:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}</p>
        <p><strong>Sent To:</strong> ${data.recipientEmail}</p>
        ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
      </div>
      
      <p>
        <a href="https://universal.californiatelecom.com/quotes" 
           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Quote
        </a>
      </p>
    </div>
  `;
}

function generateCustomerOpenedEmail(data: any, userName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Customer Opened Quote Email</h2>
      
      <p>Hello ${userName},</p>
      
      <p>Good news! Your customer has opened the quote email:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #666;">Quote Details</h3>
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Quote Number:</strong> ${data.quoteNumber}</p>
        <p><strong>Amount:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}</p>
        <p><strong>Opened At:</strong> ${new Date(data.openedAt).toLocaleString()}</p>
        <p><strong>Open Count:</strong> ${data.openCount} time(s)</p>
      </div>
      
      <p>This is a great sign that the customer is interested. Consider following up!</p>
      
      <p>
        <a href="https://universal.californiatelecom.com/quotes" 
           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Quote
        </a>
      </p>
    </div>
  `;
}

function generateQuoteAcceptedEmail(data: any, userName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">🎉 Quote Accepted!</h2>
      
      <p>Hello ${userName},</p>
      
      <p>Fantastic news! Your quote has been accepted by the customer:</p>
      
      <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <h3 style="margin-top: 0; color: #155724;">Accepted Quote Details</h3>
        <p><strong>Client:</strong> ${data.clientName}</p>
        <p><strong>Quote Number:</strong> ${data.quoteNumber}</p>
        <p><strong>Amount:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount)}</p>
        <p><strong>Accepted By:</strong> ${data.acceptedBy}</p>
        <p><strong>Accepted At:</strong> ${new Date(data.acceptedAt).toLocaleString()}</p>
        ${data.commission ? `<p><strong>Your Commission:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.commission)}</p>` : ''}
      </div>
      
      <p>Congratulations on closing this deal! The quote is now approved and an order will be created.</p>
      
      <p>
        <a href="https://universal.californiatelecom.com/quotes" 
           style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Quote
        </a>
      </p>
    </div>
  `;
}

function generateDealCreatedEmail(data: any, userName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Deal Created</h2>
      
      <p>Hello ${userName},</p>
      
      <p>A new deal has been registered in the system:</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #666;">Deal Details</h3>
        <p><strong>Deal Name:</strong> ${data.dealName}</p>
        <p><strong>Client:</strong> ${data.clientName || 'Not specified'}</p>
        <p><strong>Deal Value:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.dealValue)}</p>
        <p><strong>Stage:</strong> ${data.stage}</p>
        <p><strong>Probability:</strong> ${data.probability}%</p>
        ${data.expectedCloseDate ? `<p><strong>Expected Close Date:</strong> ${new Date(data.expectedCloseDate).toLocaleDateString()}</p>` : ''}
        ${data.agentName ? `<p><strong>Agent:</strong> ${data.agentName}</p>` : ''}
        ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
      </div>
      
      <p>
        <a href="https://universal.californiatelecom.com/deal-registration" 
           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Deal
        </a>
      </p>
    </div>
  `;
}

serve(handler);