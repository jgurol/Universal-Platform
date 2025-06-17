
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Item } from "@/types/items";

export const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching items:', error);
        toast({
          title: "Error",
          description: "Failed to fetch items",
          variant: "destructive"
        });
      } else {
        setItems(data || []);
      }
    } catch (err) {
      console.error('Error in fetchItems:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (newItem: Omit<Item, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          ...newItem,
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding item:', error);
        toast({
          title: "Failed to add item",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setItems(prev => [...prev, data]);
        toast({
          title: "Item added",
          description: `${newItem.name} has been added successfully.`,
        });
      }
    } catch (err) {
      console.error('Error in addItem:', err);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive"
      });
    }
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating item:', error);
        toast({
          title: "Failed to update item",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setItems(prev => prev.map(item => item.id === itemId ? data : item));
        toast({
          title: "Item updated",
          description: "Item has been updated successfully.",
        });
      }
    } catch (err) {
      console.error('Error in updateItem:', err);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive"
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: false })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting item:', error);
        toast({
          title: "Failed to delete item",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setItems(prev => prev.filter(item => item.id !== itemId));
        toast({
          title: "Item deleted",
          description: "Item has been deleted successfully.",
        });
      }
    } catch (err) {
      console.error('Error in deleteItem:', err);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  return {
    items,
    isLoading,
    fetchItems,
    addItem,
    updateItem,
    deleteItem
  };
};
