
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@/types/categories";
import { Vendor } from "@/types/vendors";

export const useCarrierOptions = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOptions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (vendorError) {
        console.error('Error fetching vendors:', vendorError);
        toast({
          title: "Error fetching vendors",
          description: vendorError.message,
          variant: "destructive"
        });
        return;
      }

      // Fetch categories (circuit types)
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, description, type, is_active, user_id, created_at, updated_at')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (categoryError) {
        console.error('Error fetching categories:', categoryError);
        toast({
          title: "Error fetching categories",
          description: categoryError.message,
          variant: "destructive"
        });
        return;
      }

      setVendors(vendorData || []);
      setCategories(categoryData || []);
    } catch (error) {
      console.error('Error in fetchOptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendor and category options",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOptions();
    }
  }, [user]);

  return {
    vendors,
    categories,
    loading,
    refetchOptions: fetchOptions
  };
};
