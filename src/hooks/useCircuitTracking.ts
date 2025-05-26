
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { CircuitTracking, CircuitMilestone } from "@/types/orders";

export const useCircuitTracking = () => {
  const { user } = useAuth();
  const [circuitTrackings, setCircuitTrackings] = useState<CircuitTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCircuitTrackings = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('circuit_tracking')
        .select(`
          *,
          order:orders(*),
          quote_item:quote_items(
            *,
            item:items(*),
            address:client_addresses(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCircuitTrackings(data || []);
    } catch (error) {
      console.error('Error fetching circuit trackings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCircuitProgress = async (id: string, progress: number, status?: string) => {
    try {
      const updates: any = { progress_percentage: progress };
      if (status) updates.status = status;
      
      const { error } = await supabase
        .from('circuit_tracking')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchCircuitTrackings();
    } catch (error) {
      console.error('Error updating circuit progress:', error);
      throw error;
    }
  };

  const addMilestone = async (circuitTrackingId: string, milestone: Omit<CircuitMilestone, 'id' | 'circuit_tracking_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('circuit_milestones')
        .insert({
          circuit_tracking_id: circuitTrackingId,
          ...milestone
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding milestone:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCircuitTrackings();
  }, [user]);

  return {
    circuitTrackings,
    isLoading,
    fetchCircuitTrackings,
    updateCircuitProgress,
    addMilestone
  };
};
