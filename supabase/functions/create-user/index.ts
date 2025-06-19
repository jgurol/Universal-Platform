
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

interface CreateUserRequest {
  email: string;
  full_name: string;
  role: 'admin' | 'agent';
  associated_agent_id?: string;
  send_welcome_email: boolean;
}

// Input validation schemas
const emailSchema = {
  validate: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dangerousChars = /[\r\n\0%]/;
    return emailRegex.test(email) && !dangerousChars.test(email) && email.length <= 254;
  }
};

const nameSchema = {
  validate: (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
    return nameRegex.test(name.trim()) && name.trim().length >= 1 && name.length <= 100;
  }
};

// Secure password generation
const generateSecurePassword = (length: number = 16): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const body = await req.text();
    if (body.length > 10000) { // Prevent DoS via large payloads
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Request payload too large" 
      }), {
        status: 413,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const requestData: CreateUserRequest = JSON.parse(body);
    const { email, full_name, role, associated_agent_id, send_welcome_email } = requestData;

    // Input validation
    if (!emailSchema.validate(email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid email format" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!nameSchema.validate(full_name)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid name format" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!['admin', 'agent'].includes(role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid role specified" 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Creating user with validated data:', { email: email.toLowerCase(), full_name: full_name.trim(), role, associated_agent_id, send_welcome_email });

    // Generate a secure temporary password
    const temporaryPassword = generateSecurePassword(12);
    
    // Create user with Supabase Auth using service role
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
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

    // Update user profile with validated data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: full_name.trim(),
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
            email: email.toLowerCase().trim(),
            fullName: full_name.trim(),
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
      error: "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
