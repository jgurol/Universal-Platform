
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
  templateId?: string;
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

    const { agentId, agentEmail, agentName, commissionRate, templateId }: RequestBody = await req.json();
    
    console.log('Received request for agent:', { agentId, agentEmail, agentName, templateId });
    
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

    // Get the selected template or fall back to default
    let templateContent = '';
    if (templateId) {
      console.log('Fetching specific template:', templateId);
      const { data: selectedTemplate, error: templateError } = await supabaseClient
        .from('agent_agreement_templates')
        .select('content')
        .eq('id', templateId)
        .maybeSingle();

      if (!templateError && selectedTemplate) {
        templateContent = selectedTemplate.content;
        console.log('Using selected template');
      } else {
        console.log('Selected template not found, falling back to default');
      }
    }

    // If no template content yet, try to get the default template
    if (!templateContent) {
      console.log('Fetching default template');
      const { data: defaultTemplate, error: defaultError } = await supabaseClient
        .from('agent_agreement_templates')
        .select('content')
        .eq('is_default', true)
        .maybeSingle();

      if (!defaultError && defaultTemplate) {
        templateContent = defaultTemplate.content;
        console.log('Using default template');
      }
    }

    // If still no template, use fallback content
    if (!templateContent) {
      console.log('No templates found, using fallback content');
      templateContent = `
        <p><strong>INDEPENDENT SALES AGENT AGREEMENT</strong></p>
        <p>This Agreement is entered into between the Company and the Agent named below.</p>
        <p><strong>1. APPOINTMENT:</strong> Company hereby appoints Agent as an independent sales representative.</p>
        <p><strong>2. COMMISSION:</strong> Agent shall receive a commission of {{commission_rate}}% on all accepted orders.</p>
        <p><strong>3. INDEPENDENT CONTRACTOR:</strong> Agent is an independent contractor and not an employee of Company.</p>
      `;
    }
    
    // Generate secure token for agent agreement access
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token expires in 30 days

    console.log('Creating token for agent:', agentId, 'Token expires at:', expiresAt.toISOString());

    // Store the token in database with template content
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
