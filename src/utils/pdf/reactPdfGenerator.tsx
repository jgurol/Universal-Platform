
import { pdf } from '@react-pdf/renderer';
import { QuotePdfDocument } from './reactPdf/QuotePdfDocument';
import { Quote, ClientInfo } from '@/pages/Index';

export const generateQuotePDFWithReactPdf = async (quote: Quote, clientInfo?: ClientInfo) => {
  console.log('[React PDF] Generating PDF with React PDF renderer');
  
  try {
    // Generate PDF blob
    const blob = await pdf(<QuotePdfDocument quote={quote} clientInfo={clientInfo} />).toBlob();
    
    console.log('[React PDF] PDF generated successfully');
    return blob;
  } catch (error) {
    console.error('[React PDF] Error generating PDF:', error);
    throw error;
  }
};

// Helper function to download the PDF
export const downloadQuotePDF = async (quote: Quote, clientInfo?: ClientInfo) => {
  try {
    const blob = await generateQuotePDFWithReactPdf(quote, clientInfo);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quote-${quote.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('[React PDF] PDF downloaded successfully');
  } catch (error) {
    console.error('[React PDF] Error downloading PDF:', error);
    throw error;
  }
};
