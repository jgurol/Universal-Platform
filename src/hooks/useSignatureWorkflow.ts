
import { useState } from 'react';
import { Quote, ClientInfo } from '@/pages/Index';
import { SignatureData } from '@/components/SignatureDialog';
import { generateSignedQuotePDF } from '@/utils/pdfUtils';
import { useToast } from '@/hooks/use-toast';

export const useSignatureWorkflow = () => {
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [currentClientInfo, setCurrentClientInfo] = useState<ClientInfo | undefined>();
  const [salespersonName, setSalespersonName] = useState<string | undefined>();
  const { toast } = useToast();

  const initiateSignature = (quote: Quote, clientInfo?: ClientInfo, salesperson?: string) => {
    setCurrentQuote(quote);
    setCurrentClientInfo(clientInfo);
    setSalespersonName(salesperson);
    setIsSignatureDialogOpen(true);
  };

  const handleSignatureComplete = async (signatureData: SignatureData) => {
    if (!currentQuote) return;

    try {
      // Generate signed PDF
      const signedPdf = await generateSignedQuotePDF(
        currentQuote,
        currentClientInfo,
        salespersonName,
        signatureData
      );

      // Download the signed PDF
      const fileName = `signed-quote-${currentQuote.quoteNumber || currentQuote.id.slice(0, 8)}.pdf`;
      signedPdf.save(fileName);

      toast({
        title: "Agreement Signed Successfully",
        description: `The signed agreement has been downloaded as ${fileName}`,
      });

      // Reset state
      setCurrentQuote(null);
      setCurrentClientInfo(undefined);
      setSalespersonName(undefined);
      setIsSignatureDialogOpen(false);

    } catch (error) {
      console.error('Error generating signed PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate signed agreement. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    isSignatureDialogOpen,
    setIsSignatureDialogOpen,
    currentQuote,
    currentClientInfo,
    initiateSignature,
    handleSignatureComplete
  };
};
