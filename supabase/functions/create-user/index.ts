
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  full_name: string;
  role: 'admin' | 'agent';
  associated_agent_id?: string;
  send_welcome_email: boolean;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, role, associated_agent_id, send_welcome_email }: CreateUserRequest = await req.json();

    console.log('Creating user with data:', { email, full_name, role, associated_agent_id, send_welcome_email });

    // Generate a temporary password
    const temporaryPassword = Math.random().toString(36).slice(-12);
    
    // Create user with Supabase Auth using service role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
      }
    });

    if (authError) {
      console.error("Error creating user:", authError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: authError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No user data returned" 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('User created successfully:', authData.user.id);

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: full_name,
        role: role,
        associated_agent_id: associated_agent_id === "none" ? null : associated_agent_id,
        is_associated: role === 'admin' ? true : !!associated_agent_id,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `User created but profile update failed: ${profileError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Profile updated successfully');

    // Send welcome email if requested
    if (send_welcome_email) {
      try {
        const { error: emailError } = await supabase.functions.invoke('send-user-email', {
          body: {
            email: email,
            fullName: full_name,
            type: 'welcome',
            temporaryPassword: temporaryPassword,
          }
        });

        if (emailError) {
          console.error("Error sending welcome email:", emailError);
        } else {
          console.log('Welcome email sent successfully');
        }
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: authData.user,
      temporaryPassword: temporaryPassword 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Exception creating user:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
