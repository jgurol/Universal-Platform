
import jsPDF from 'jspdf';
import { PDFGenerationContext } from './types';
import { resolveBillingAddress, resolveServiceAddress } from './helpers/addressResolver';
import { renderBillingInfo } from './sections/billingInfo';
import { renderServiceAddress } from './sections/serviceAddress';
import { renderContactInfo } from './sections/contactInfo';

export const addClientInfo = (doc: jsPDF, context: PDFGenerationContext): number => {
  const { quote, clientInfo } = context;
  
  console.log('PDF clientInfo.ts - Starting addClientInfo with:', {
    quoteId: quote.id,
    quoteBillingAddress: quote.billingAddress,
    quoteServiceAddress: quote.serviceAddress,
    clientInfoAddress: clientInfo?.address,
    hasClientInfo: !!clientInfo
  });
  
  if (!clientInfo) {
    console.log('PDF clientInfo.ts - No clientInfo provided, returning early');
    return 105;
  }
  
  // Column positions - narrower margins
  const billingCol = 10;
  const serviceCol = 105;
  
  // Section headers
  let yPos = 85;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Billing Information', billingCol, yPos);
  doc.text('Service Address', serviceCol, yPos);
  
  // Underlines
  doc.setDrawColor(200, 200, 200);
  doc.line(billingCol, yPos + 2, billingCol + 45, yPos + 2);
  doc.line(serviceCol, yPos + 2, serviceCol + 45, yPos + 2);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Resolve addresses
  const billingAddress = resolveBillingAddress(context);
  const serviceAddress = resolveServiceAddress(context, billingAddress);
  
  // Render sections
  renderBillingInfo(doc, context, yPos, billingAddress, billingCol);
  renderServiceAddress(doc, context, yPos, serviceAddress, serviceCol);
  renderContactInfo(doc, context, yPos, billingCol, serviceCol);
  
  console.log('PDF clientInfo.ts - Completed addClientInfo, returning Y position:', 165);
  return 165; // Return Y position for next section
};
