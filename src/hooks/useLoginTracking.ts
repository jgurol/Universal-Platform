
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useLoginTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Record login when user is authenticated
      recordLogin();
    }
  }, [user]);

  const recordLogin = async () => {
    if (!user) return;

    try {
      // Get user's IP and user agent (optional)
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase
        .from('login_logs')
        .insert({
          user_id: user.id,
          user_agent: userAgent
        });

      if (error) {
        console.error('Error recording login:', error);
      }
    } catch (error) {
      console.error('Error recording login:', error);
    }
  };

  return { recordLogin };
};
