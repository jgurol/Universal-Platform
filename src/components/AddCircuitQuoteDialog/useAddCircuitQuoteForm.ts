
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DealRegistration } from "@/services/dealRegistrationService";
import { useClientInfos } from "@/hooks/useClientInfos";

interface UseAddCircuitQuoteFormProps {
  onQuoteAdded?: () => void;
  onOpenChange: (open: boolean) => void;
}

export const useAddCircuitQuoteForm = ({ onQuoteAdded, onOpenChange }: UseAddCircuitQuoteFormProps) => {
  const [clientId, setClientId] = useState("");
  const [selectedDealId, setSelectedDealId] = useState("");
  const [location, setLocation] = useState("");
  const [suite, setSuite] = useState("");
  const [staticIp, setStaticIp] = useState(false);
  const [slash29, setSlash29] = useState(false);
  const [dhcp, setDhcp] = useState(false);
  const [mikrotikRequired, setMikrotikRequired] = useState(false);
  
  const [deals, setDeals] = useState<DealRegistration[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const { clientInfos, fetchClientInfos } = useClientInfos();

  useEffect(() => {
    fetchClientInfos();
    fetchDeals();
  }, [fetchClientInfos]);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !selectedDealId || !location.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a client, deal registration, and provide a service address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get client info to extract company name
      const { data: clientInfo } = await supabase
        .from('client_info')
        .select('company_name')
        .eq('id', clientId)
        .single();

      const { data, error } = await supabase
        .from('circuit_quotes')
        .insert({
          client_info_id: clientId,
          client_name: clientInfo?.company_name || 'Unknown Client',
          location: location,
          suite: suite || null,
          deal_registration_id: selectedDealId,
          static_ip: staticIp,
          slash_29: slash29,
          dhcp: dhcp,
          mikrotik_required: mikrotikRequired,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Circuit quote created successfully!"
      });

      // Reset form
      setClientId("");
      setSelectedDealId("");
      setLocation("");
      setSuite("");
      setStaticIp(false);
      setSlash29(false);
      setDhcp(false);
      setMikrotikRequired(false);

      onOpenChange(false);
      onQuoteAdded?.();
    } catch (error) {
      console.error('Error creating circuit quote:', error);
      toast({
        title: "Error",
        description: "Failed to create circuit quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Form state
    clientId,
    setClientId,
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
    
    // Data
    clientInfos,
    deals,
    
    // Loading states
    isSubmitting,
    
    // Actions
    handleSubmit
  };
};
