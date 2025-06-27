
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
  console.log('🔥 send-agent-agreement function called!');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Parsing request body...');
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { agentId, agentEmail, agentName, commissionRate, templateId }: RequestBody = requestBody;
    
    console.log('Processing request for agent:', { agentId, agentEmail, agentName, commissionRate, templateId });
    
    // Verify the agent exists
    console.log('Verifying agent exists in database...');
    const { data: existingAgent, error: agentCheckError } = await supabaseClient
      .from('agents')
      .select('id, first_name, last_name, email')
      .eq('id', agentId)
      .single();

    if (agentCheckError) {
      console.error('Error checking agent existence:', agentCheckError);
      throw new Error('Failed to verify agent exists');
    }

    if (!existingAgent) {
      console.error('Agent not found in database:', agentId);
      throw new Error('Agent not found in database');
    }

    console.log('Agent verified successfully:', existingAgent);

    // Get template content
    let templateContent = '';
    
    if (templateId && templateId !== '') {
      console.log('Fetching specific template:', templateId);
      const { data: selectedTemplate, error: templateError } = await supabaseClient
        .from('agent_agreement_templates')
        .select('content')
        .eq('id', templateId)
        .single();

      if (!templateError && selectedTemplate) {
        templateContent = selectedTemplate.content;
        console.log('Using selected template, content length:', templateContent.length);
      } else {
        console.log('Selected template not found, will try default. Error:', templateError);
      }
    }

    // If no template content yet, try to get the default template
    if (!templateContent) {
      console.log('Fetching default template...');
      const { data: defaultTemplate, error: defaultError } = await supabaseClient
        .from('agent_agreement_templates')
        .select('content')
        .eq('is_default', true)
        .single();

      if (!defaultError && defaultTemplate) {
        templateContent = defaultTemplate.content;
        console.log('Using default template, content length:', templateContent.length);
      } else {
        console.log('No default template found, error:', defaultError);
      }
    }

    // If still no template, use fallback content
    if (!templateContent) {
      console.log('Using fallback template content');
      templateContent = `
        <p><strong>INDEPENDENT SALES AGENT AGREEMENT</strong></p>
        <p>This Agreement is entered into between the Company and the Agent named below.</p>
        <p><strong>1. APPOINTMENT:</strong> Company hereby appoints Agent as an independent sales representative.</p>
        <p><strong>2. COMMISSION:</strong> Agent shall receive a commission of {{commission_rate}}% on all accepted orders.</p>
        <p><strong>3. INDEPENDENT CONTRACTOR:</strong> Agent is an independent contractor and not an employee of Company.</p>
      `;
    }
    
    // Replace template variables
    templateContent = templateContent.replace(/{{commission_rate}}/g, commissionRate.toString());
    templateContent = templateContent.replace(/{{agent_name}}/g, agentName);
    
    // Generate secure token for agent agreement access
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Token expires in 30 days

    console.log('Creating agreement token for agent:', agentId, 'Token expires at:', expiresAt.toISOString());

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
    const agreementUrl = `${req.headers.get('origin') || 'https://tsvvpssyzthwbkygrlgw.supabase.co'}/agent-agreement/${token}`;
    console.log('Agreement URL created:', agreementUrl);

    // Check if Resend API key is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured in environment variables');
      throw new Error('RESEND_API_KEY not configured');
    }
    console.log('Resend API key found, length:', resendApiKey.length);

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

    console.log('Preparing to send email to:', agentEmail);
    console.log('Email body length:', emailBody.length);

    const emailPayload = {
      from: 'sales@californiatelecom.com',
      to: [agentEmail],
      subject: 'Complete Your Agent Agreement - Commission Rate: ' + commissionRate + '%',
      html: emailBody,
    };

    console.log('Email payload prepared:', { ...emailPayload, html: '[HTML_CONTENT]' });

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log('Resend API response status:', emailResponse.status);
    console.log('Resend API response headers:', Object.fromEntries(emailResponse.headers.entries()));

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error response:', errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully! Resend response:', emailResult);

    const successResponse = { 
      success: true, 
      message: 'Agent agreement email sent successfully',
      agreementUrl: agreementUrl,
      emailId: emailResult.id
    };

    console.log('Returning success response:', successResponse);

    return new Response(
      JSON.stringify(successResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('🚨 ERROR in send-agent-agreement function:', error);
    console.error('Error stack:', error.stack);
    
    const errorResponse = { 
      success: false, 
      error: error.message || 'Unknown error occurred'
    };
    
    console.log('Returning error response:', errorResponse);
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
