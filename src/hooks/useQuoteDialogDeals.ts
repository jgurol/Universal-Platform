
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DealRegistration } from "@/services/dealRegistrationService";

export const useQuoteDialogDeals = (clientInfoId: string) => {
  const [associatedDeals, setAssociatedDeals] = useState<DealRegistration[]>([]);

  // Fetch deals associated with the selected client
  useEffect(() => {
    const fetchAssociatedDeals = async () => {
      if (!clientInfoId || clientInfoId === "none") {
        setAssociatedDeals([]);
        return;
      }

      try {
        const { data: deals, error } = await supabase
          .from('deal_registrations')
          .select('*')
          .eq('client_info_id', clientInfoId)
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
  }, [clientInfoId]);

  return {
    associatedDeals,
    setAssociatedDeals
  };
};
