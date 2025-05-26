
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
      // First get all circuit tracking records
      const { data: trackingData, error: trackingError } = await supabase
        .from('circuit_tracking')
        .select(`
          *,
          order:orders(
            order_number,
            quote_id
          ),
          quote_item:quote_items(
            quantity,
            unit_price,
            item:items(
              *,
              category:categories(name)
            ),
            address:client_addresses(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (trackingError) throw trackingError;

      // Now get all orders and their quote items to ensure we have complete data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          quote:quotes!inner(
            *,
            quote_items(
              quantity,
              unit_price,
              item:items(
                *,
                category:categories(name)
              ),
              address:client_addresses(*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Create a comprehensive list that includes all quote items for orders
      const allTrackingItems: CircuitTracking[] = [];

      // Add existing circuit tracking records
      if (trackingData) {
        allTrackingItems.push(...trackingData);
      }

      // For each order, ensure all quote items are represented
      if (ordersData) {
        ordersData.forEach(order => {
          if (order.quote?.quote_items) {
            order.quote.quote_items.forEach(quoteItem => {
              // Check if this quote item already has a circuit tracking record
              const existingTracking = trackingData?.find(tracking => 
                tracking.quote_item_id === quoteItem.id
              );

              // If no existing tracking, create a virtual one for display
              if (!existingTracking) {
                allTrackingItems.push({
                  id: `virtual-${quoteItem.id}`,
                  order_id: order.id,
                  quote_item_id: quoteItem.id,
                  circuit_type: quoteItem.item?.category?.name || 'General',
                  status: 'ordered',
                  progress_percentage: 0,
                  created_at: order.created_at,
                  updated_at: order.updated_at,
                  item_name: quoteItem.item?.name,
                  item_description: quoteItem.item?.description,
                  order: {
                    order_number: order.order_number
                  },
                  quote_item: quoteItem
                });
              }
            });
          }
        });
      }

      setCircuitTrackings(allTrackingItems);
    } catch (error) {
      console.error('Error fetching circuit trackings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCircuitProgress = async (id: string, progress: number, status?: string) => {
    try {
      // Handle virtual tracking items - create actual tracking record first
      if (id.startsWith('virtual-')) {
        const quoteItemId = id.replace('virtual-', '');
        const virtualItem = circuitTrackings.find(item => item.id === id);
        
        if (virtualItem) {
          const { data: newTracking, error: createError } = await supabase
            .from('circuit_tracking')
            .insert({
              order_id: virtualItem.order_id,
              quote_item_id: quoteItemId,
              circuit_type: virtualItem.circuit_type,
              status: status || 'in_progress',
              progress_percentage: progress,
              item_name: virtualItem.item_name,
              item_description: virtualItem.item_description
            })
            .select()
            .single();

          if (createError) throw createError;
          
          await fetchCircuitTrackings();
          return;
        }
      }

      // Update existing tracking record
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
      // Handle virtual tracking items - create actual tracking record first
      if (circuitTrackingId.startsWith('virtual-')) {
        const quoteItemId = circuitTrackingId.replace('virtual-', '');
        const virtualItem = circuitTrackings.find(item => item.id === circuitTrackingId);
        
        if (virtualItem) {
          const { data: newTracking, error: createError } = await supabase
            .from('circuit_tracking')
            .insert({
              order_id: virtualItem.order_id,
              quote_item_id: quoteItemId,
              circuit_type: virtualItem.circuit_type,
              status: 'in_progress',
              progress_percentage: 0,
              item_name: virtualItem.item_name,
              item_description: virtualItem.item_description
            })
            .select()
            .single();

          if (createError) throw createError;
          
          // Now add milestone to the newly created tracking record
          const { error: milestoneError } = await supabase
            .from('circuit_milestones')
            .insert({
              circuit_tracking_id: newTracking.id,
              ...milestone
            });

          if (milestoneError) throw milestoneError;
          await fetchCircuitTrackings();
          return;
        }
      }

      // Add milestone to existing tracking record
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
