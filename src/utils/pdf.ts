
import { Quote, ClientInfo } from '@/pages/Index';
import { supabase } from '@/integrations/supabase/client';

export const generateQuotePDF = async (quote: Quote, clientInfo?: ClientInfo, salespersonName?: string) => {
  console.log('PDF Generation - Starting PDFShift generation for quote:', quote.id);
  
  try {
    // Call our edge function to generate PDF using PDFShift
    const { data, error } = await supabase.functions.invoke('generate-pdf-pdfshift', {
      body: {
        quote,
        clientInfo,
        salespersonName
      }
    });

    if (error) {
      console.error('PDFShift generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }

    if (!data || !data.pdf) {
      throw new Error('No PDF data received from PDFShift');
    }

    // Convert base64 to blob
    const pdfBlob = base64ToBlob(data.pdf, 'application/pdf');
    
    // Create a mock jsPDF-like object for compatibility
    const mockPDF = {
      output: (type: string) => {
        if (type === 'blob') {
          return pdfBlob;
        }
        return pdfBlob;
      }
    };

    console.log('PDF Generation - PDFShift PDF generated successfully');
    return mockPDF;
    
  } catch (error) {
    console.error('Error generating PDF with PDFShift:', error);
    throw error;
  }
};

// Helper function to convert base64 to blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};
