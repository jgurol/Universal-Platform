
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useUserProfile = () => {
  const { user } = useAuth();
  const [associatedAgentId, setAssociatedAgentId] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('associated_agent_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
      } else if (data && data.associated_agent_id) {
        setAssociatedAgentId(data.associated_agent_id);
        console.info('[fetchUserProfile] User is associated with agent:', data.associated_agent_id);
      } else {
        console.info('[fetchUserProfile] User is not associated with any agent.');
        setAssociatedAgentId(null);
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  return {
    associatedAgentId,
    fetchUserProfile
  };
};
