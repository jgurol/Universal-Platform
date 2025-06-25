
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCircuitQuoteService } from "@/services/circuitQuotes/circuitQuoteService";
import { useCarrierQuoteService } from "@/services/circuitQuotes/carrierQuoteService";
import { fetchCircuitQuotes } from "@/services/circuitQuotes/fetchCircuitQuotes";
import type { CircuitQuote, CarrierQuote } from "./types";

export const useCircuitQuotes = () => {
  const [quotes, setQuotes] = useState<CircuitQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const circuitQuoteService = useCircuitQuoteService();
  const carrierQuoteService = useCarrierQuoteService();

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedQuotes = await fetchCircuitQuotes(user?.id, isAdmin);
      setQuotes(fetchedQuotes);
    } catch (error) {
      console.error('[useCircuitQuotes] Unexpected error in fetchQuotes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch circuit quotes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin, toast]);

  const addQuote = async (newQuote: Omit<CircuitQuote, "id" | "created_at" | "carriers" | "categories">, categories: string[] = []) => {
    if (!user?.id) return;
    
    const result = await circuitQuoteService.addQuote(newQuote, user.id, categories);
    if (result) {
      await fetchQuotes();
    }
  };

  const updateQuote = async (updatedQuote: CircuitQuote) => {
    const success = await circuitQuoteService.updateQuote(updatedQuote);
    if (success) {
      setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
    }
  };

  const deleteQuote = async (quoteId: string) => {
    const success = await circuitQuoteService.deleteQuote(quoteId);
    if (success) {
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
    }
  };

  const addCarrierQuote = async (circuitQuoteId: string, carrierQuote: Omit<CarrierQuote, "id" | "circuit_quote_id">) => {
    const newCarrier = await carrierQuoteService.addCarrierQuote(circuitQuoteId, carrierQuote);
    if (newCarrier) {
      setQuotes(prev => prev.map(quote => 
        quote.id === circuitQuoteId 
          ? { 
              ...quote, 
              carriers: [...quote.carriers, {
                ...newCarrier,
                other_costs: newCarrier.other_costs || 0
              }],
              // Update status to 'researching' if it was 'new_pricing'
              status: quote.status === 'new_pricing' ? 'researching' : quote.status
            }
          : quote
      ));
    }
  };

  const updateCarrierQuote = async (carrierQuote: CarrierQuote) => {
    const success = await carrierQuoteService.updateCarrierQuote(carrierQuote);
    if (success) {
      setQuotes(prev => prev.map(quote => ({
        ...quote,
        carriers: quote.carriers.map(carrier => 
          carrier.id === carrierQuote.id ? carrierQuote : carrier
        )
      })));
    }
  };

  const deleteCarrierQuote = async (carrierId: string) => {
    const success = await carrierQuoteService.deleteCarrierQuote(carrierId);
    if (success) {
      setQuotes(prev => prev.map(quote => ({
        ...quote,
        carriers: quote.carriers.filter(carrier => carrier.id !== carrierId)
      })));
    }
  };

  useEffect(() => {
    // Only fetch if we have auth information
    if (user !== undefined && isAdmin !== undefined) {
      console.log('[useCircuitQuotes] useEffect triggered - fetching quotes');
      fetchQuotes();
    } else {
      console.log('[useCircuitQuotes] Waiting for auth information...');
    }
  }, [user, isAdmin, fetchQuotes]);

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
