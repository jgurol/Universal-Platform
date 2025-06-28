
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Quote {
  id: string;
  [key: string]: any;
}

export const useQuoteAcceptance = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [signatureData, setSignatureData] = useState<string>('');
  
  const { toast } = useToast();

  const handleAcceptQuote = async (
    quote: Quote | null,
    onSuccess: (acceptedAt: string) => void
  ) => {
    if (!quote || !clientName.trim() || !clientEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature to accept the quote.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting quote acceptance process for quote:', quote.id);

      // First check if quote acceptance already exists
      const { data: existingAcceptance, error: checkError } = await supabase
        .from('quote_acceptances')
        .select('id, accepted_at')
        .eq('quote_id', quote.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing acceptance:', checkError);
        throw new Error('Failed to check acceptance status');
      }

      if (existingAcceptance) {
        console.log('Quote already accepted, showing success state');
        onSuccess(existingAcceptance.accepted_at);
        toast({
          title: "Already Accepted",
          description: "This quote has already been accepted.",
        });
        return;
      }

      // Record the acceptance
      const acceptanceData = {
        quote_id: quote.id,
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        signature_data: signatureData,
        ip_address: null,
        user_agent: navigator.userAgent
      };

      console.log('Inserting acceptance data...');

      const { data: acceptanceResult, error: acceptanceError } = await supabase
        .from('quote_acceptances')
        .insert(acceptanceData)
        .select()
        .single();

      if (acceptanceError) {
        console.error('Error inserting acceptance:', acceptanceError);
        throw new Error(`Failed to record acceptance: ${acceptanceError.message}`);
      }

      console.log('Acceptance recorded successfully:', acceptanceResult);

      // Update the quote status
      console.log('Updating quote status...');
      
      const updateData = {
        accepted_by: clientName.trim(),
        status: 'approved'
      };

      const { data: updateResult, error: updateError } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quote.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating quote status:', updateError);
        console.warn('Quote acceptance recorded but status update failed:', updateError.message);
        
        // Try via edge function
        try {
          console.log('Attempting status update via edge function...');
          const { data: statusResult, error: statusError } = await supabase.functions
            .invoke('fix-quote-approval', {
              body: { 
                quoteId: quote.id,
                action: 'update_status_only'
              }
            });

          if (statusError) {
            console.warn('Edge function status update also failed:', statusError);
          } else {
            console.log('Status updated successfully via edge function:', statusResult);
          }
        } catch (edgeErr) {
          console.warn('Edge function call failed:', edgeErr);
        }
      } else {
        console.log('Quote status updated successfully:', updateResult);
      }

      // Show success
      onSuccess(acceptanceResult.accepted_at);
      toast({
        title: "Quote Accepted",
        description: "Thank you! Your quote has been successfully accepted.",
      });

    } catch (err: any) {
      console.error('Quote acceptance process failed:', err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to accept quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    clientName,
    setClientName,
    clientEmail,
    setClientEmail,
    signatureData,
    setSignatureData,
    handleAcceptQuote
  };
};
