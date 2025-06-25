
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useQuoteNumberGeneration = (open: boolean) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quoteNumber, setQuoteNumber] = useState("");

  // Generate next quote number using the new global database function
  useEffect(() => {
    const generateNextQuoteNumber = async () => {
      if (open && user) {
        try {
          console.log('[useQuoteNumberGeneration] Generating next global quote number');
          
          const { data, error } = await supabase.rpc('get_next_quote_number');

          if (error) {
            console.error('[useQuoteNumberGeneration] Error generating quote number:', error);
            toast({
              title: "Error",
              description: "Failed to generate quote number. Please try again.",
              variant: "destructive",
            });
            setQuoteNumber("3500"); // Fallback
            return;
          }

          console.log('[useQuoteNumberGeneration] Generated global quote number:', data);
          setQuoteNumber(data.toString());
        } catch (err) {
          console.error('[useQuoteNumberGeneration] Exception generating quote number:', err);
          setQuoteNumber("3500"); // Fallback
          toast({
            title: "Error",
            description: "Failed to generate quote number. Using fallback number.",
            variant: "destructive",
          });
        }
      }
    };

    generateNextQuoteNumber();
  }, [open, user, toast]);

  return {
    quoteNumber,
    setQuoteNumber
  };
};
