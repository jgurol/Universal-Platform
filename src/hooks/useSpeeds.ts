
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Speed {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  user_id: string;
}

export const useSpeeds = () => {
  const [speeds, setSpeeds] = useState<Speed[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchSpeeds = async () => {
    if (!user) {
      setSpeeds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching speeds for user:', user.id, 'isAdmin:', isAdmin);
      
      let query = supabase
        .from('speeds')
        .select('*')
        .eq('is_active', true);

      // Only filter by user_id if not admin
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error('Error fetching speeds:', error);
        throw error;
      }

      console.log('Speeds fetched:', data);
      setSpeeds(data || []);
    } catch (error) {
      console.error('Error fetching speeds:', error);
      toast({
        title: "Error",
        description: "Failed to fetch speed options",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeeds();
  }, [user, isAdmin]);

  return { speeds, loading, refetchSpeeds: fetchSpeeds };
};
