
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';

export const addQuoteItems = (doc: jsPDF, context: PDFGenerationContext, startY: number): number => {
  const { quote, clientInfo } = context;
  let yPos = startY + 10;
  
  // Quote Title - large and bold like in reference
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  
  // Create title based on service address or company name
  let quoteTitle = '';
  if (quote.serviceAddress) {
    // Extract location from service address for title
    const addressParts = quote.serviceAddress.split(',');
    const location = addressParts.length >= 2 ? addressParts[1].trim() : 'Service Location';
    quoteTitle = `${clientInfo?.company_name || 'Client'} - ${location} - Secondary Circuit`;
  } else {
    quoteTitle = quote.description || `${clientInfo?.company_name || 'Client'} - Service Agreement`;
  }
  
  doc.text(quoteTitle, 20, yPos);
  yPos += 15;
  
  // Items table would go here if needed
  // For now, we'll just add some spacing
  
  return yPos;
};
