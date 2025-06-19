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
      // First get all circuit tracking records with better category data fetching
      const { data: trackingData, error: trackingError } = await supabase
        .from('circuit_tracking')
        .select(`
          *,
          order:orders(
            order_number,
            quote_id
          ),
          quote_item:quote_items(
            id,
            quantity,
            unit_price,
            item:items(
              *,
              category:categories(name, type)
            ),
            address:client_addresses(*),
            quote:quotes(
              id,
              quote_number,
              accepted_at,
              accepted_by,
              client_info:client_info(
                company_name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (trackingError) throw trackingError;

      console.log('Raw circuit tracking data from database:', trackingData);

      // Now get all orders and their quote items to ensure we have complete data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          quote:quotes!inner(
            *,
            client_info:client_info(*),
            quote_items(
              id,
              quantity,
              unit_price,
              item:items(
                *,
                category:categories(name, type)
              ),
              address:client_addresses(*)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      console.log('Orders data with full category info:', ordersData);

      // Create a comprehensive list that includes all quote items for orders
      const allTrackingItems: CircuitTracking[] = [];

      // Include ALL existing circuit tracking records without filtering by category type
      if (trackingData) {
        console.log(`Found ${trackingData.length} existing circuit tracking records`);
        allTrackingItems.push(...trackingData);
      }

      // For each order, ensure all quote items are represented, but only if they don't already exist
      if (ordersData) {
        ordersData.forEach(order => {
          if (order.quote?.quote_items) {
            order.quote.quote_items.forEach(quoteItem => {
              // Check if this quote item already has a circuit tracking record
              const existingTracking = allTrackingItems.find(tracking => 
                tracking.quote_item_id === quoteItem.id
              );

              const categoryType = quoteItem.item?.category?.type;
              const categoryName = quoteItem.item?.category?.name;
              console.log(`Checking quote item for order ${order.order_number}:`, {
                itemName: quoteItem.item?.name,
                categoryName: categoryName,
                categoryType: categoryType,
                hasExistingTracking: !!existingTracking
              });

              // Only create virtual tracking if no existing tracking exists and item has meaningful data
              if (!existingTracking && 
                  quoteItem.item?.name && 
                  quoteItem.item.name.toLowerCase() !== 'broadband' &&
                  quoteItem.item.name.toLowerCase() !== categoryName?.toLowerCase() &&
                  quoteItem.item.name.trim().length > 3 &&
                  !quoteItem.item.name.toLowerCase().includes('general')) {
                
                console.log(`Creating virtual tracking for item: ${quoteItem.item.name} in order ${order.order_number}`);
                
                allTrackingItems.push({
                  id: `virtual-${quoteItem.id}`,
                  order_id: order.id,
                  quote_item_id: quoteItem.id,
                  circuit_type: categoryName || 'Circuit',
                  stage: 'Ready to Order',
                  progress_percentage: 0,
                  created_at: order.created_at,
                  updated_at: order.updated_at,
                  item_name: quoteItem.item?.name,
                  item_description: quoteItem.item?.description,
                  order: {
                    order_number: order.order_number
                  },
                  quote_item: {
                    ...quoteItem,
                    quote: {
                      id: order.quote.id,
                      quote_number: order.quote.quote_number,
                      accepted_at: order.quote.accepted_at,
                      accepted_by: order.quote.accepted_by,
                      client_info: order.quote.client_info
                    }
                  }
                });
              }
            });
          }
        });
      }

      console.log('Final tracking items:', allTrackingItems);
      setCircuitTrackings(allTrackingItems);
    } catch (error) {
      console.error('Error fetching circuit trackings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCircuitStage = async (id: string, stage: string) => {
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
              stage: stage,
              progress_percentage: 0,
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
      const { error } = await supabase
        .from('circuit_tracking')
        .update({ stage })
        .eq('id', id);

      if (error) throw error;
      await fetchCircuitTrackings();
    } catch (error) {
      console.error('Error updating circuit stage:', error);
      throw error;
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
              stage: virtualItem.stage || 'Ready to Order',
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
              stage: virtualItem.stage || 'Ready to Order',
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
    updateCircuitStage,
    updateCircuitProgress: updateCircuitStage, // Keep backward compatibility
    addMilestone
  };
};
