
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CarrierOption {
  id: string;
  name: string;
  is_active: boolean;
}

export interface CircuitTypeOption {
  id: string;
  name: string;
  is_active: boolean;
}

export const useCarrierOptions = () => {
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [circuitTypes, setCircuitTypes] = useState<CircuitTypeOption[]>([]);
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

      // Fetch circuit type options
      const { data: circuitTypeData, error: circuitTypeError } = await supabase
        .from('circuit_type_options')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (circuitTypeError) {
        console.error('Error fetching circuit type options:', circuitTypeError);
        toast({
          title: "Error fetching circuit types",
          description: circuitTypeError.message,
          variant: "destructive"
        });
        return;
      }

      setCarriers(carrierData || []);
      setCircuitTypes(circuitTypeData || []);
    } catch (error) {
      console.error('Error in fetchOptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch carrier and circuit type options",
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
    circuitTypes,
    loading,
    refetchOptions: fetchOptions
  };
};
