
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { CircuitQuote, CarrierQuote } from "./types";

export const useCircuitQuotes = () => {
  const [quotes, setQuotes] = useState<CircuitQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[useCircuitQuotes] Starting fetch with user:', user?.id);
      
      // Fetch circuit quotes with their carrier quotes
      const { data: circuitQuotes, error: quotesError } = await supabase
        .from('circuit_quotes')
        .select(`
          *,
          carrier_quotes (*)
        `)
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('Error fetching circuit quotes:', quotesError);
        toast({
          title: "Error fetching quotes",
          description: quotesError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('[useCircuitQuotes] Raw data from Supabase:', circuitQuotes);

      // Transform data to match the expected format
      const transformedQuotes: CircuitQuote[] = (circuitQuotes || []).map(quote => ({
        id: quote.id,
        client_name: quote.client_name,
        client_info_id: quote.client_info_id,
        location: quote.location,
        suite: quote.suite || '',
        created_at: new Date(quote.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        status: quote.status as 'new_pricing' | 'researching' | 'completed' | 'sent_to_customer',
        static_ip: quote.static_ip || false,
        slash_29: quote.slash_29 || false,
        carriers: (quote.carrier_quotes || []).map((carrier: any) => ({
          id: carrier.id,
          circuit_quote_id: carrier.circuit_quote_id,
          carrier: carrier.carrier,
          type: carrier.type,
          speed: carrier.speed,
          price: carrier.price,
          notes: carrier.notes || '',
          term: carrier.term || '',
          color: carrier.color,
          install_fee: carrier.install_fee || false,
          site_survey_needed: carrier.site_survey_needed || false,
          no_service: carrier.no_service || false
        }))
      }));

      console.log('[useCircuitQuotes] Transformed quotes:', transformedQuotes);
      setQuotes(transformedQuotes);
    } catch (error) {
      console.error('Error in fetchQuotes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch circuit quotes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const addQuote = async (newQuote: Omit<CircuitQuote, "id" | "created_at" | "carriers">) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create quotes",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('circuit_quotes')
        .insert({
          user_id: user.id,
          client_info_id: newQuote.client_info_id,
          client_name: newQuote.client_name,
          location: newQuote.location,
          suite: newQuote.suite,
          status: newQuote.status,
          static_ip: newQuote.static_ip,
          slash_29: newQuote.slash_29
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding circuit quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Refresh quotes
      await fetchQuotes();
      
      toast({
        title: "Success",
        description: "Circuit quote created successfully"
      });
    } catch (error) {
      console.error('Error in addQuote:', error);
      toast({
        title: "Error",
        description: "Failed to create circuit quote",
        variant: "destructive"
      });
    }
  };

  const updateQuote = async (updatedQuote: CircuitQuote) => {
    try {
      const { error } = await supabase
        .from('circuit_quotes')
        .update({
          client_name: updatedQuote.client_name,
          location: updatedQuote.location,
          suite: updatedQuote.suite,
          status: updatedQuote.status,
          static_ip: updatedQuote.static_ip,
          slash_29: updatedQuote.slash_29,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedQuote.id);

      if (error) {
        console.error('Error updating circuit quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
    } catch (error) {
      console.error('Error in updateQuote:', error);
      toast({
        title: "Error",
        description: "Failed to update circuit quote",
        variant: "destructive"
      });
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      // Delete the circuit quote - carrier quotes will be deleted automatically due to CASCADE
      const { error } = await supabase
        .from('circuit_quotes')
        .delete()
        .eq('id', quoteId);

      if (error) {
        console.error('Error deleting circuit quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
      
      toast({
        title: "Success",
        description: "Circuit quote deleted successfully"
      });
    } catch (error) {
      console.error('Error in deleteQuote:', error);
      toast({
        title: "Error",
        description: "Failed to delete circuit quote",
        variant: "destructive"
      });
    }
  };

  const addCarrierQuote = async (circuitQuoteId: string, carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => {
    try {
      const { data, error } = await supabase
        .from('carrier_quotes')
        .insert({
          circuit_quote_id: circuitQuoteId,
          carrier: carrierQuote.carrier,
          type: carrierQuote.type,
          speed: carrierQuote.speed,
          price: carrierQuote.price,
          term: carrierQuote.term,
          notes: carrierQuote.notes,
          color: carrierQuote.color,
          install_fee: carrierQuote.install_fee,
          site_survey_needed: carrierQuote.site_survey_needed,
          no_service: carrierQuote.no_service
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding carrier quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Refresh quotes to get updated data
      await fetchQuotes();
      
      toast({
        title: "Success",
        description: "Carrier quote added successfully"
      });
    } catch (error) {
      console.error('Error in addCarrierQuote:', error);
      toast({
        title: "Error",
        description: "Failed to add carrier quote",
        variant: "destructive"
      });
    }
  };

  const updateCarrierQuote = async (carrierQuote: CarrierQuote) => {
    try {
      const { error } = await supabase
        .from('carrier_quotes')
        .update({
          carrier: carrierQuote.carrier,
          type: carrierQuote.type,
          speed: carrierQuote.speed,
          price: carrierQuote.price,
          term: carrierQuote.term,
          notes: carrierQuote.notes,
          color: carrierQuote.color,
          install_fee: carrierQuote.install_fee,
          site_survey_needed: carrierQuote.site_survey_needed,
          no_service: carrierQuote.no_service,
          updated_at: new Date().toISOString()
        })
        .eq('id', carrierQuote.id);

      if (error) {
        console.error('Error updating carrier quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Refresh quotes to get updated data
      await fetchQuotes();
      
      toast({
        title: "Success",
        description: "Carrier quote updated successfully"
      });
    } catch (error) {
      console.error('Error in updateCarrierQuote:', error);
      toast({
        title: "Error",
        description: "Failed to update carrier quote",
        variant: "destructive"
      });
    }
  };

  const deleteCarrierQuote = async (carrierId: string) => {
    try {
      const { error } = await supabase
        .from('carrier_quotes')
        .delete()
        .eq('id', carrierId);

      if (error) {
        console.error('Error deleting carrier quote:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Refresh quotes to get updated data
      await fetchQuotes();
      
      toast({
        title: "Success",
        description: "Carrier quote deleted successfully"
      });
    } catch (error) {
      console.error('Error in deleteCarrierQuote:', error);
      toast({
        title: "Error",
        description: "Failed to delete carrier quote",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Fetch quotes on initial load, even if user is not yet available
    fetchQuotes();
  }, [fetchQuotes]);

  return {
    quotes,
    loading,
    fetchQuotes,
    addQuote,
    updateQuote,
    deleteQuote,
    addCarrierQuote,
    updateCarrierQuote,
    deleteCarrierQuote
  };
};
