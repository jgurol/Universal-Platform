
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ClientInfo } from "@/types/index";
import { DealRegistration } from "@/services/dealRegistrationService";

interface UseAddCircuitQuoteFormProps {
  onQuoteAdded?: () => void;
  onOpenChange: (open: boolean) => void;
}

export const useAddCircuitQuoteForm = ({ onQuoteAdded, onOpenChange }: UseAddCircuitQuoteFormProps) => {
  const [clientId, setClientId] = useState("");
  const [selectedDealId, setSelectedDealId] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [staticIp, setStaticIp] = useState(false);
  const [slash29, setSlash29] = useState(false);
  const [dhcp, setDhcp] = useState(false);
  const [mikrotikRequired, setMikrotikRequired] = useState(false);
  
  const [clientInfos, setClientInfos] = useState<ClientInfo[]>([]);
  const [deals, setDeals] = useState<DealRegistration[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchClientInfos();
    fetchDeals();
    fetchCategories();
  }, []);

  const fetchClientInfos = async () => {
    try {
      const { data, error } = await supabase
        .from('client_infos')
        .select('*')
        .order('company_name');
      
      if (error) throw error;
      setClientInfos(data);
    } catch (error) {
      console.error('Error fetching client infos:', error);
    }
  };

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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('circuit_quote_categories')
        .select('name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCategories(data.map(item => item.name));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || selectedCategories.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a client and at least one category.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('circuit_quotes')
        .insert({
          client_id: clientId,
          deal_registration_id: selectedDealId === "no-deal" ? null : selectedDealId,
          categories: selectedCategories,
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
      setSelectedCategories([]);
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
    selectedCategories,
    setSelectedCategories,
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
    categories,
    
    // Loading states
    isSubmitting,
    
    // Actions
    handleSubmit,
    handleCategoryChange
  };
};
