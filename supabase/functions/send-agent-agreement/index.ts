
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  agentId: string;
  agentEmail: string;
  agentName: string;
  commissionRate: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { agentId, agentEmail, agentName, commissionRate }: RequestBody = await req.json();
    
    console.log('Received request for agent:', { agentId, agentEmail, agentName });
    
    // First, let's verify the agent exists before creating the token
    const { data: existingAgent, error: agentCheckError } = await supabaseClient
      .from('agents')
      .select('id, first_name, last_name, email')
      .eq('id', agentId)
      .maybeSingle();

    if (agentCheckError) {
      console.error('Error checking agent existence:', agentCheckError);
      throw new Error('Failed to verify agent exists');
    }

    if (!existingAgent) {
      console.error('Agent not found in database:', agentId);
      throw new Error('Agent not found in database');
    }

    console.log('Agent verified:', existingAgent);
    
    // Generate secure token for agent agreement access
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token expires in 30 days

    console.log('Creating token for agent:', agentId, 'Token expires at:', expiresAt.toISOString());

    // Store the token in database
    const { error: tokenError } = await supabaseClient
      .from('agent_agreement_tokens')
      .insert({
        agent_id: agentId,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      throw new Error('Failed to create agreement token');
    }

    // Create agreement form URL
    const agreementUrl = `${req.headers.get('origin')}/agent-agreement/${token}`;
    console.log('Agreement URL created:', agreementUrl);

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailBody = `
      <h2>Welcome to Our Agent Program!</h2>
      <p>Dear ${agentName},</p>
      
      <p>You have been invited to join our sales agent program with a commission rate of <strong>${commissionRate}%</strong>.</p>
      
      <p>To complete your registration, please:</p>
      <ol>
        <li>Review and sign our agent agreement</li>
        <li>Upload your signed W9 form</li>
      </ol>
      
      <p><strong>Click the link below to access your agent agreement form:</strong></p>
      <p><a href="${agreementUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Agent Agreement</a></p>
      
      <p><em>This link will expire in 30 days. If you need assistance, please contact us.</em></p>
      
      <p>Best regards,<br>The Team</p>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'sales@californiatelecom.com',
        to: [agentEmail],
        subject: 'Complete Your Agent Agreement - Commission Rate: ' + commissionRate + '%',
        html: emailBody,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      throw new Error('Failed to send email');
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Agent agreement email sent successfully',
        agreementUrl: agreementUrl 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending agent agreement email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
