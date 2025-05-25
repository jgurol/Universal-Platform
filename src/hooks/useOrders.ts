
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types/orders";

export const useOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('Fetching orders for user:', user.id);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      
      console.log('Fetched orders:', data);
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Attempting to delete order:', orderId, 'for user:', user.id);
      
      // First, let's check if the order exists and belongs to the user
      const { data: orderCheck, error: checkError } = await supabase
        .from('orders')
        .select('id, user_id')
        .eq('id', orderId)
        .single();

      if (checkError) {
        console.error('Error checking order:', checkError);
        throw new Error(`Order check failed: ${checkError.message}`);
      }

      if (!orderCheck) {
        throw new Error('Order not found');
      }

      if (orderCheck.user_id !== user.id) {
        throw new Error('Not authorized to delete this order');
      }

      console.log('Order exists and belongs to user, proceeding with deletion');

      // Now delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Order deleted successfully from database:', orderId);

      // Verify deletion by checking if order still exists
      const { data: verifyDelete } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .single();

      if (verifyDelete) {
        console.error('Order still exists after deletion attempt!');
        throw new Error('Order deletion failed - order still exists in database');
      }

      console.log('Deletion verified - order no longer exists in database');
      
      // Update local state immediately
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.filter(order => order.id !== orderId);
        console.log('Updated orders after deletion:', updatedOrders);
        return updatedOrders;
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  return {
    orders,
    isLoading,
    fetchOrders,
    deleteOrder
  };
};
