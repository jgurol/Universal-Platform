
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const findUserByEmail = async (email: string) => {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }

  return users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
};

export const storeResetToken = async (userId: string, hashedToken: string) => {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  const { data, error } = await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token: hashedToken,
      expires_at: expiresAt.toISOString(),
      used: false
    })
    .select()
    .single();

  if (error) {
    console.error("Error storing reset token:", error);
    throw error;
  }

  return data;
};
