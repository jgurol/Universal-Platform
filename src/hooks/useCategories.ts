
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Category } from "@/types/categories";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive"
        });
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Error in fetchCategories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = async (newCategory: Omit<Category, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user || !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can add categories",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...newCategory,
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding category:', error);
        toast({
          title: "Failed to add category",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setCategories(prev => [...prev, data]);
        toast({
          title: "Category added",
          description: `${newCategory.name} has been added successfully.`,
        });
      }
    } catch (err) {
      console.error('Error in addCategory:', err);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
    if (!user || !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit categories",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating category:', error);
        toast({
          title: "Failed to update category",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setCategories(prev => prev.map(category => category.id === categoryId ? data : category));
        toast({
          title: "Category updated",
          description: "Category has been updated successfully.",
        });
      }
    } catch (err) {
      console.error('Error in updateCategory:', err);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive"
      });
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!user || !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete categories",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting category:', error);
        toast({
          title: "Failed to delete category",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setCategories(prev => prev.filter(category => category.id !== categoryId));
        toast({
          title: "Category deleted",
          description: "Category has been deleted successfully.",
        });
      }
    } catch (err) {
      console.error('Error in deleteCategory:', err);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  return {
    categories,
    isLoading,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory
  };
};
