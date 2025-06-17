
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@/types/categories";

export interface CarrierOption {
  id: string;
  name: string;
  is_active: boolean;
}

export const useCarrierOptions = () => {
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOptions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch carrier options
      const { data: carrierData, error: carrierError } = await supabase
        .from('carrier_options')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (carrierError) {
        console.error('Error fetching carrier options:', carrierError);
        toast({
          title: "Error fetching carriers",
          description: carrierError.message,
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

      setCarriers(carrierData || []);
      setCategories(categoryData || []);
    } catch (error) {
      console.error('Error in fetchOptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch carrier and category options",
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
    carriers,
    categories,
    loading,
    refetchOptions: fetchOptions
  };
};
