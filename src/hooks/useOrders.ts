
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
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('user_id', user.id); // Ensure user can only delete their own orders

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Order deleted successfully:', orderId);
      
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
