import { Quote, ClientInfo } from '@/pages/Index';
import { supabase } from '@/integrations/supabase/client';

export const generateQuotePDFWithPDFShift = async (quote: Quote, clientInfo?: ClientInfo): Promise<Blob> => {
  console.log('[PDFShift] Generating PDF via Edge Function');
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-pdf', {
      body: {
        quote,
        clientInfo
      }
    });

    if (error) {
      console.error('[PDFShift] Edge Function error:', error);
      throw new Error(`Edge Function error: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data received from Edge Function');
    }

    // The Edge Function should return raw PDF bytes
    // Convert the response directly to a Blob
    const blob = new Blob([data], { type: 'application/pdf' });
    
    console.log('[PDFShift] PDF generated successfully via Edge Function, size:', blob.size, 'bytes');
    
    // Validate that we actually got a PDF by checking the blob size
    if (blob.size === 0) {
      throw new Error('Received empty PDF data');
    }
    
    return blob;
    
  } catch (error) {
    console.error('[PDFShift] Error generating PDF via Edge Function:', error);
    throw error;
  }
};

// Helper function to download the PDF
export const downloadQuotePDFWithPDFShift = async (quote: Quote, clientInfo?: ClientInfo) => {
  try {
    const blob = await generateQuotePDFWithPDFShift(quote, clientInfo);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quote-${quote.quoteNumber || quote.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('[PDFShift] PDF downloaded successfully');
  } catch (error) {
    console.error('[PDFShift] Error downloading PDF:', error);
    throw error;
  }
};
