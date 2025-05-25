
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Vendor } from "@/types/vendors";

export const useVendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVendors = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching vendors:', error);
        toast({
          title: "Error",
          description: "Failed to fetch vendors",
          variant: "destructive"
        });
      } else {
        setVendors(data || []);
      }
    } catch (err) {
      console.error('Error in fetchVendors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addVendor = async (newVendor: Omit<Vendor, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          ...newVendor,
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error adding vendor:', error);
        toast({
          title: "Failed to add vendor",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setVendors(prev => [...prev, data]);
        toast({
          title: "Vendor added",
          description: `${newVendor.name} has been added successfully.`,
        });
      }
    } catch (err) {
      console.error('Error in addVendor:', err);
      toast({
        title: "Error",
        description: "Failed to add vendor",
        variant: "destructive"
      });
    }
  };

  const updateVendor = async (vendorId: string, updates: Partial<Vendor>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', vendorId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating vendor:', error);
        toast({
          title: "Failed to update vendor",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setVendors(prev => prev.map(vendor => vendor.id === vendorId ? data : vendor));
        toast({
          title: "Vendor updated",
          description: "Vendor has been updated successfully.",
        });
      }
    } catch (err) {
      console.error('Error in updateVendor:', err);
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [user]);

  return {
    vendors,
    isLoading,
    fetchVendors,
    addVendor,
    updateVendor
  };
};
