
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Speed {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export const useSpeeds = () => {
  const [speeds, setSpeeds] = useState<Speed[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSpeeds = async () => {
    if (!user) {
      setSpeeds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching speeds for user:', user.id);
      
      const { data, error } = await supabase
        .from('speeds')
        .select('*')
        .eq('is_active', true)
        .order('name');

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
  }, [user]);

  return { speeds, loading, refetchSpeeds: fetchSpeeds };
};
