
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAcceptanceStatus = (quoteId: string | undefined) => {
  const [isAccepted, setIsAccepted] = useState(false);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);

  const checkAcceptanceStatus = async () => {
    if (!quoteId) return;

    try {
      const { data: acceptanceData, error: acceptanceError } = await supabase
        .from('quote_acceptances')
        .select('accepted_at')
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (acceptanceError) {
        console.error('Error checking acceptance:', acceptanceError);
      }

      if (acceptanceData) {
        console.log('Quote already accepted at:', acceptanceData.accepted_at);
        setIsAccepted(true);
        setAcceptedAt(acceptanceData.accepted_at);
      }
    } catch (err) {
      console.error('Error checking acceptance status:', err);
    }
  };

  useEffect(() => {
    checkAcceptanceStatus();
  }, [quoteId]);

  return {
    isAccepted,
    acceptedAt,
    setIsAccepted,
    setAcceptedAt
  };
};
