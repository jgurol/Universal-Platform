
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealRegistration } from "@/services/dealRegistrationService";
import { useToast } from "@/hooks/use-toast";

export const useAddCircuitQuoteForm = (clientId: string, open: boolean) => {
  const [selectedDealId, setSelectedDealId] = useState("");
  const [location, setLocation] = useState("");
  const [suite, setSuite] = useState("");
  const [staticIp, setStaticIp] = useState(false);
  const [slash29, setSlash29] = useState(false);
  const [dhcp, setDhcp] = useState(false);
  const [mikrotikRequired, setMikrotikRequired] = useState(true);
  const [circuitCategories, setCircuitCategories] = useState<string[]>([]);
  const [associatedDeals, setAssociatedDeals] = useState<DealRegistration[]>([]);
  const { toast } = useToast();

  // Fetch deals associated with the selected client
  useEffect(() => {
    const fetchAssociatedDeals = async () => {
      if (!clientId) {
        setAssociatedDeals([]);
        setSelectedDealId("");
        return;
      }

      try {
        const { data: deals, error } = await supabase
          .from('deal_registrations')
          .select('*')
          .eq('client_info_id', clientId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching associated deals:', error);
          setAssociatedDeals([]);
        } else {
          setAssociatedDeals(deals || []);
        }
      } catch (error) {
        console.error('Error fetching associated deals:', error);
        setAssociatedDeals([]);
      }
    };

    fetchAssociatedDeals();
  }, [clientId]);

  const resetForm = () => {
    setSelectedDealId("");
    setLocation("");
    setSuite("");
    setStaticIp(false);
    setSlash29(false);
    setDhcp(false);
    setMikrotikRequired(true);
    setCircuitCategories([]);
    setAssociatedDeals([]);
  };

  const validateForm = (clientName: string) => {
    if (!clientName || !location) {
      toast({
        title: "Error",
        description: "Please select a client and enter a location",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  return {
    selectedDealId,
    setSelectedDealId,
    location,
    setLocation,
    suite,
    setSuite,
    staticIp,
    setStaticIp,
    slash29,
    setSlash29,
    dhcp,
    setDhcp,
    mikrotikRequired,
    setMikrotikRequired,
    circuitCategories,
    setCircuitCategories,
    associatedDeals,
    resetForm,
    validateForm
  };
};
