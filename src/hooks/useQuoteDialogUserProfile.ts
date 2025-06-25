
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useQuoteDialogUserProfile = (open: boolean) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Fetch user profile and determine access level
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !open) {
        setUserProfile(null);
        return;
      }

      try {
        console.log('[useQuoteDialogUserProfile] Fetching user profile for:', user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('associated_agent_id, role, full_name, email')
          .eq('id', user.id)
          .single();

        console.log('[useQuoteDialogUserProfile] User profile:', profile);
        setUserProfile(profile);
        setIsAdmin(profile?.role === 'admin');
        
        // Set current user name
        if (profile?.full_name && profile.full_name.trim() !== '') {
          setCurrentUserName(profile.full_name);
        } else if (profile?.email) {
          setCurrentUserName(profile.email);
        } else if (user.email) {
          setCurrentUserName(user.email.split('@')[0]);
        } else {
          setCurrentUserName('Current User');
        }
      } catch (error) {
        console.error('[useQuoteDialogUserProfile] Error fetching user profile:', error);
        setUserProfile(null);
        setIsAdmin(false);
        setCurrentUserName(user.email?.split('@')[0] || 'Current User');
      }
    };

    fetchUserProfile();
  }, [user, open]);

  return {
    userProfile,
    currentUserName,
    isAdmin
  };
};
