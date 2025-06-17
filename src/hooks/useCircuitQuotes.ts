
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CircuitQuote {
  id: string;
  client_name: string;
  client_info_id: string | null;
  location: string;
  suite: string;
  created_at: string;
  carriers: CarrierQuote[];
  status: 'new_pricing' | 'researching' | 'completed' | 'ready_for_review' | 'sent_to_customer';
}

export interface CarrierQuote {
  id: string;
  circuit_quote_id: string;
  carrier: string;
  type: string;
  speed: string;
  price: number;
  notes: string;
  term: string;
  color: string;
}

export const useCircuitQuotes = () => {
  const [quotes, setQuotes] = useState<CircuitQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchQuotes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
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
        status: quote.status as 'new_pricing' | 'researching' | 'completed' | 'ready_for_review' | 'sent_to_customer',
        carriers: quote.carrier_quotes || []
      }));

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
  };

  const addQuote = async (newQuote: Omit<CircuitQuote, "id" | "created_at" | "carriers">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('circuit_quotes')
        .insert({
          user_id: user.id,
          client_info_id: newQuote.client_info_id,
          client_name: newQuote.client_name,
          location: newQuote.location,
          suite: newQuote.suite,
          status: newQuote.status
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
          color: carrierQuote.color
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
    if (user) {
      fetchQuotes();
    }
  }, [user]);

  return {
    quotes,
    loading,
    fetchQuotes,
    addQuote,
    updateQuote,
    addCarrierQuote,
    updateCarrierQuote,
    deleteCarrierQuote
  };
};
