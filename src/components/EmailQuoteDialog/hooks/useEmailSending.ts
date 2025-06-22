
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateQuotePDF } from "@/utils/pdfUtils";
import { Quote, ClientInfo } from "@/pages/Index";

interface UseEmailSendingProps {
  quote: Quote;
  clientInfo?: ClientInfo;
  quoteOwnerName: string;
  onEmailStatusChange: (status: 'idle' | 'success' | 'error') => void;
  onClose: () => void;
}

export const useEmailSending = ({
  quote,
  clientInfo,
  quoteOwnerName,
  onEmailStatusChange,
  onClose
}: UseEmailSendingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendEmail = async (
    recipientEmail: string,
    ccEmails: string[],
    subject: string,
    message: string
  ) => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    onEmailStatusChange('idle');
    
    try {
      // Fetch primary contact for PDF generation
      let primaryContact = null;
      if (clientInfo?.id) {
        console.log('useEmailSending - Fetching primary contact for PDF generation, client ID:', clientInfo.id);
        const { data: contactData, error: contactError } = await supabase
          .from('client_contacts')
          .select('*')
          .eq('client_info_id', clientInfo.id)
          .eq('is_primary', true)
          .maybeSingle();
        
        if (contactError) {
          console.error('useEmailSending - Error fetching primary contact:', contactError);
        } else if (contactData) {
          primaryContact = contactData;
          console.log('useEmailSending - Found primary contact for PDF:', contactData.first_name, contactData.last_name, 'email:', contactData.email);
        } else {
          console.log('useEmailSending - No primary contact found for PDF generation');
        }
      }

      console.log('useEmailSending - Generating PDF with primary contact:', primaryContact);
      const pdf = await generateQuotePDF(quote, clientInfo, quoteOwnerName);
      const pdfBlob = pdf.output('blob');
      
      const reader = new FileReader();
      reader.onload = async function() {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
          // Include primary contact in the email function call
          const { data, error } = await supabase.functions.invoke('send-quote-email', {
            body: {
              to: recipientEmail,
              cc: ccEmails.length > 0 ? ccEmails : undefined,
              subject,
              message,
              pdfBase64: base64String,
              fileName: `Quote_${quote.quoteNumber || quote.id.slice(0, 8)}.pdf`,
              quoteId: quote.id,
              primaryContact // Pass the primary contact to the email function
            }
          });

          if (error) {
            console.error('Supabase function error:', error);
            onEmailStatusChange('error');
            
            await supabase
              .from('quotes')
              .update({ email_status: 'error' })
              .eq('id', quote.id);
            
            toast({
              title: "Failed to send email",
              description: error.message || "There was an error sending the quote. Please try again.",
              variant: "destructive"
            });
            return;
          }

          if (data?.success === true) {
            onEmailStatusChange('success');
            
            await supabase
              .from('quotes')
              .update({ email_status: 'success' })
              .eq('id', quote.id);
            
            toast({
              title: "Email sent successfully",
              description: `Quote has been sent to ${recipientEmail}${ccEmails.length > 0 ? ` and ${ccEmails.length} CC recipient(s)` : ''}`,
            });
            
            setTimeout(() => {
              onClose();
            }, 3000);
          } else {
            onEmailStatusChange('error');
            
            await supabase
              .from('quotes')
              .update({ email_status: 'error' })
              .eq('id', quote.id);
            
            toast({
              title: "Failed to send email",
              description: data?.error || "There was an error sending the quote. Please try again.",
              variant: "destructive"
            });
          }
        } catch (emailError) {
          console.error('Error calling email function:', emailError);
          onEmailStatusChange('error');
          
          await supabase
            .from('quotes')
            .update({ email_status: 'error' })
            .eq('id', quote.id);
          
          toast({
            title: "Failed to send email",
            description: "There was an error sending the quote. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(pdfBlob);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      onEmailStatusChange('error');
      
      await supabase
        .from('quotes')
        .update({ email_status: 'error' })
        .eq('id', quote.id);
      
      toast({
        title: "Failed to generate PDF",
        description: "There was an error generating the quote PDF. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSendEmail
  };
};
